from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select, col, func
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import List, Optional, Literal
from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime
from zoneinfo import ZoneInfo

from database import get_session
from sql_models import RepairTicket, Customer, User, Product
from dependencies import get_current_user, require_admin

router = APIRouter()

def get_vn_time():
    return datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).isoformat()

# ==================== DTOs ====================

RepairStatus = Literal['received', 'diagnosing', 'waiting_approval', 'repairing', 'ready', 'delivered', 'cancelled']

class RepairPartCreate(BaseModel):
    product_id: str
    quantity: int
    unit_price: float = 0
    note: Optional[str] = None

class RepairServiceCreate(BaseModel):
    name: str
    cost: float = 0
    note: Optional[str] = None

class RepairDiagnosis(BaseModel):
    symptoms: str
    root_cause: Optional[str] = None
    technician_note: Optional[str] = None
    attachments: List[str] = []

class RepairQuoteCreate(BaseModel):
    parts: List[RepairPartCreate] = []
    services: List[RepairServiceCreate] = []
    note: Optional[str] = None

class RepairTicketCreate(BaseModel):
    customer_id: str
    product_id: Optional[str] = None
    product_name: str
    serial_number: Optional[str] = None
    symptoms: str
    note: Optional[str] = None
    priority: Literal['low', 'normal', 'high', 'urgent'] = 'normal'

class RepairTicketResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    ticket_number: str
    customer_id: str
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    product_id: Optional[str] = None
    product_name: str
    serial_number: Optional[str] = None
    status: RepairStatus
    priority: str
    symptoms: str
    diagnosis: Optional[RepairDiagnosis] = None
    quote_parts: List[dict] = []
    quote_services: List[dict] = []
    total_estimate: float = 0
    quote_approved: bool = False
    parts_issued: bool = False
    created_by: Optional[str] = None
    technician_id: Optional[str] = None
    technician_name: Optional[str] = None
    created_at: str
    updated_at: str

# ==================== ROUTES ====================

async def generate_ticket_number(session: AsyncSession) -> str:
    date_str = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).strftime('%Y%m%d')
    start_of_day = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).replace(hour=0, minute=0, second=0).isoformat()
    query = select(func.count(RepairTicket.id)).where(RepairTicket.created_at >= start_of_day)
    count = (await session.exec(query)).one() or 0
    return f"REP-{date_str}-{str(count + 1).zfill(3)}"

@router.get("/admin/repairs/tickets", response_model=List[RepairTicketResponse])
async def list_repair_tickets(
    status: Optional[str] = None, 
    customer_id: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user)
):
    query = select(RepairTicket).order_by(RepairTicket.created_at.desc())
    if status: query = query.where(RepairTicket.status == status)
    if customer_id: query = query.where(RepairTicket.customer_id == customer_id)
    
    tickets = (await session.exec(query)).all()
    
    # Enrich
    result = []
    for t in tickets:
        cust = await session.get(Customer, t.customer_id)
        tech = await session.get(User, t.technician_id) if t.technician_id else None
        
        result.append(RepairTicketResponse(
            **t.model_dump(),
            customer_name=cust.name if cust else None,
            customer_phone=cust.phone if cust else None,
            technician_name=tech.full_name if tech else None
        ))
    return result

@router.post("/admin/repairs/tickets", response_model=RepairTicketResponse)
async def create_repair_ticket(data: RepairTicketCreate, session: AsyncSession = Depends(get_session), user=Depends(get_current_user)):
    cust = await session.get(Customer, data.customer_id)
    if not cust: raise HTTPException(status_code=404, detail="Customer not found")
    
    ticket_number = await generate_ticket_number(session)
    ticket = RepairTicket(
        ticket_number=ticket_number,
        **data.model_dump(),
        status="received",
        created_by=user.id
    )
    session.add(ticket)
    await session.commit()
    await session.refresh(ticket)
    
    return RepairTicketResponse(
        **ticket.model_dump(),
        customer_name=cust.name,
        customer_phone=cust.phone
    )

@router.get("/admin/repairs/tickets/{ticket_id}", response_model=RepairTicketResponse)
async def get_repair_ticket(ticket_id: str, session: AsyncSession = Depends(get_session), user=Depends(get_current_user)):
    ticket = await session.get(RepairTicket, ticket_id)
    if not ticket: raise HTTPException(status_code=404, detail="Ticket not found")
    
    cust = await session.get(Customer, ticket.customer_id)
    tech = await session.get(User, ticket.technician_id) if ticket.technician_id else None
    
    return RepairTicketResponse(
        **ticket.model_dump(),
        customer_name=cust.name if cust else None,
        customer_phone=cust.phone if cust else None,
        technician_name=tech.full_name if tech else None
    )

@router.post("/admin/repairs/tickets/{ticket_id}/diagnose")
async def diagnose_ticket(ticket_id: str, diagnosis: RepairDiagnosis, session: AsyncSession = Depends(get_session), user=Depends(get_current_user)):
    ticket = await session.get(RepairTicket, ticket_id)
    if not ticket: raise HTTPException(status_code=404, detail="Ticket not found")
    
    ticket.diagnosis = diagnosis.model_dump()
    ticket.status = "diagnosing"
    if not ticket.technician_id: ticket.technician_id = user.id
    ticket.updated_at = get_vn_time()
    
    session.add(ticket)
    await session.commit()
    return {"message": "Diagnosis updated"}

@router.post("/admin/repairs/tickets/{ticket_id}/quote")
async def update_repair_quote(ticket_id: str, quote: RepairQuoteCreate, session: AsyncSession = Depends(get_session), user=Depends(get_current_user)):
    ticket = await session.get(RepairTicket, ticket_id)
    if not ticket: raise HTTPException(status_code=404, detail="Ticket not found")
    
    ticket.quote_parts = [p.model_dump() for p in quote.parts]
    ticket.quote_services = [s.model_dump() for s in quote.services]
    
    total = sum(p.quantity * p.unit_price for p in quote.parts) + sum(s.cost for s in quote.services)
    ticket.total_estimate = total
    ticket.status = "waiting_approval"
    ticket.updated_at = get_vn_time()
    
    session.add(ticket)
    await session.commit()
    return {"message": "Quote updated"}

@router.post("/admin/repairs/tickets/{ticket_id}/approve")
async def approve_repair_quote(ticket_id: str, session: AsyncSession = Depends(get_session), user=Depends(get_current_user)):
    ticket = await session.get(RepairTicket, ticket_id)
    if not ticket: raise HTTPException(status_code=404, detail="Ticket not found")
    
    ticket.quote_approved = True
    ticket.status = "repairing"
    ticket.updated_at = get_vn_time()
    
    session.add(ticket)
    await session.commit()
    return {"message": "Quote approved"}

@router.post("/admin/repairs/tickets/{ticket_id}/complete")
async def complete_repair(ticket_id: str, session: AsyncSession = Depends(get_session), user=Depends(get_current_user)):
    ticket = await session.get(RepairTicket, ticket_id)
    if not ticket: raise HTTPException(status_code=404, detail="Ticket not found")
    
    ticket.status = "ready"
    ticket.updated_at = get_vn_time()
    session.add(ticket)
    await session.commit()
    return {"message": "Repair completed"}

@router.post("/admin/repairs/tickets/{ticket_id}/deliver")
async def deliver_repair(ticket_id: str, session: AsyncSession = Depends(get_session), user=Depends(get_current_user)):
    ticket = await session.get(RepairTicket, ticket_id)
    if not ticket: raise HTTPException(status_code=404, detail="Ticket not found")
    
    ticket.status = "delivered"
    ticket.updated_at = get_vn_time()
    session.add(ticket)
    await session.commit()
    return {"message": "Device delivered"}
