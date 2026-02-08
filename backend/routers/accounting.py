from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select, col, func, or_
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import List, Optional, Literal
from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime
from zoneinfo import ZoneInfo

from database import get_session
from sql_models import Account, JournalEntry, User, StockBalance, Product, Warehouse
from dependencies import get_current_user, require_admin

router = APIRouter()

def get_vn_time():
    return datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).isoformat()

# ==================== DTOs ====================

AccountType = Literal['asset', 'liability', 'equity', 'revenue', 'expense']

class AccountCreate(BaseModel):
    code: str
    name: str
    account_type: AccountType
    parent_id: Optional[str] = None
    description: Optional[str] = None
    is_header: bool = False

class AccountResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    code: str
    name: str
    account_type: str
    parent_id: Optional[str] = None
    parent_name: Optional[str] = None
    description: Optional[str] = None
    is_header: bool = False
    balance: float = 0
    is_active: bool = True
    created_at: str
    updated_at: Optional[str] = None

JournalType = Literal['general', 'inventory', 'sales', 'purchase', 'adjustment']

class JournalLineCreate(BaseModel):
    account_id: str
    description: Optional[str] = None
    debit: float = 0
    credit: float = 0

class JournalLineResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    account_id: str
    account_code: Optional[str] = None
    account_name: Optional[str] = None
    description: Optional[str] = None
    debit: float = 0
    credit: float = 0

class JournalEntryCreate(BaseModel):
    journal_type: JournalType = 'general'
    reference: Optional[str] = None
    description: Optional[str] = None
    lines: List[JournalLineCreate]

class JournalEntryResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    entry_number: str
    journal_type: str
    reference: Optional[str] = None
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    description: Optional[str] = None
    status: str
    total_debit: float = 0
    total_credit: float = 0
    lines: List[JournalLineResponse] = []
    created_by: Optional[str] = None
    created_by_name: Optional[str] = None
    posted_at: Optional[str] = None
    created_at: str

# ==================== ACCOUNTS ROUTES ====================

@router.get("/admin/accounts", response_model=List[AccountResponse])
async def list_accounts(account_type: Optional[str] = None, session: AsyncSession = Depends(get_session), user=Depends(get_current_user)):
    stmt = select(Account).order_by(Account.code)
    if account_type: stmt = stmt.where(Account.account_type == account_type)
    
    accounts = (await session.exec(stmt)).all()
    
    # Calculate balances (Simplified: fetch aggregates)
    # This is a bit heavy for list, but okay for MVP.
    # ideally we store balance in account table and update via triggers/events
    
    # For now, just return Account info
    result = []
    for a in accounts:
        p_name = None
        if a.parent_id:
            try:
                parent = await session.get(Account, a.parent_id)
                if parent: p_name = parent.name
            except Exception:
                pass

        result.append(AccountResponse(
            **a.model_dump(),
            parent_name=p_name
        ))
    return result

@router.get("/admin/accounts/{account_id}", response_model=AccountResponse)
async def get_account(account_id: str, session: AsyncSession = Depends(get_session), user=Depends(get_current_user)):
    acc = await session.get(Account, account_id)
    if not acc: raise HTTPException(status_code=404, detail="Account not found")
    p_name = None
    if acc.parent_id:
        parent = await session.get(Account, acc.parent_id)
        if parent: p_name = parent.name
    return AccountResponse(**acc.model_dump(), parent_name=p_name)

@router.post("/admin/accounts", response_model=AccountResponse)
async def create_account(data: AccountCreate, session: AsyncSession = Depends(get_session), user=Depends(require_admin)):
    stmt = select(Account).where(Account.code == data.code)
    if (await session.exec(stmt)).first(): raise HTTPException(status_code=400, detail="Code exists")

    acc = Account(**data.model_dump())
    session.add(acc)
    await session.commit()
    await session.refresh(acc)
    return AccountResponse(**acc.model_dump())

@router.put("/admin/accounts/{account_id}", response_model=AccountResponse)
async def update_account(account_id: str, data: AccountCreate, session: AsyncSession = Depends(get_session), user=Depends(require_admin)):
    acc = await session.get(Account, account_id)
    if not acc: raise HTTPException(status_code=404, detail="Account not found")
    for k, v in data.model_dump().items():
        setattr(acc, k, v)
    session.add(acc)
    await session.commit()
    await session.refresh(acc)
    return AccountResponse(**acc.model_dump())

@router.delete("/admin/accounts/{account_id}")
async def delete_account(account_id: str, session: AsyncSession = Depends(get_session), user=Depends(require_admin)):
    acc = await session.get(Account, account_id)
    if not acc: raise HTTPException(status_code=404, detail="Account not found")
    # Check if used in journal entries
    check = select(JournalEntry).where(JournalEntry.status == 'posted')
    entries = (await session.exec(check)).all()
    for e in entries:
        for l in e.lines:
            if l.get('account_id') == account_id:
                raise HTTPException(status_code=400, detail="Cannot delete account used in journal entries")
    await session.delete(acc)
    await session.commit()
    return {"message": "Account deleted"}

# ==================== JOURNAL ROUTES ====================

async def generate_journal_number(journal_type: str, session: AsyncSession) -> str:
    prefix_map = {'general': 'JV', 'inventory': 'INV', 'sales': 'SL', 'purchase': 'PU'}
    prefix = prefix_map.get(journal_type, 'JV')
    date_str = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).strftime('%Y%m%d')
    start_of_day = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).replace(hour=0, minute=0, second=0).isoformat()
    query = select(func.count(JournalEntry.id)).where(JournalEntry.journal_type == journal_type, JournalEntry.created_at >= start_of_day)
    count = (await session.exec(query)).one() or 0
    return f"{prefix}-{date_str}-{str(count + 1).zfill(3)}"

@router.get("/admin/journal-entries", response_model=List[JournalEntryResponse])
async def list_journal_entries(skip: int=0, limit: int=50, session: AsyncSession = Depends(get_session), user=Depends(get_current_user)):
    stmt = select(JournalEntry).order_by(JournalEntry.created_at.desc()).offset(skip).limit(limit)
    entries = (await session.exec(stmt)).all()
    
    res = []
    for e in entries:
        u_name = None
        if e.created_by:
            u = await session.get(User, e.created_by)
            if u: u_name = u.full_name
            
        # Enrich lines
        resp_lines = []
        for l in e.lines:
            acc = await session.get(Account, l['account_id'])
            resp_lines.append(JournalLineResponse(
                **l, 
                account_code=acc.code if acc else None,
                account_name=acc.name if acc else None
            ))
            
        res.append(JournalEntryResponse(
            **e.model_dump(),
            created_by_name=u_name,
            lines=resp_lines
        ))
    return res

@router.post("/admin/journal-entries", response_model=JournalEntryResponse)
async def create_journal_entry(data: JournalEntryCreate, session: AsyncSession = Depends(get_session), user=Depends(get_current_user)):
    lines_data = []
    total_dr = 0
    total_cr = 0
    
    for l in data.lines:
        acc = await session.get(Account, l.account_id)
        if not acc: raise HTTPException(status_code=400, detail=f"Account {l.account_id} invalid")
        
        lines_data.append({
            "id": str(uuid.uuid4()),
            "account_id": l.account_id,
            "description": l.description,
            "debit": l.debit,
            "credit": l.credit
        })
        total_dr += l.debit
        total_cr += l.credit
        
    if abs(total_dr - total_cr) > 0.01:
        raise HTTPException(status_code=400, detail="Unbalanced entry")
        
    entry_num = await generate_journal_number(data.journal_type, session)
    
    entry = JournalEntry(
        entry_number=entry_num,
        journal_type=data.journal_type,
        reference=data.reference,
        description=data.description,
        status="posted", # MVP auto post
        total_debit=total_dr,
        total_credit=total_cr,
        lines=lines_data,
        created_by=user.id,
        posted_at=get_vn_time()
    )
    session.add(entry)
    
    # Update account balances
    # We should iterate lines and update Account balance field (+Debit -Credit for Asset/Exp)
    # Simplified logic:
    for l in data.lines:
        acc = await session.get(Account, l.account_id)
        if acc:
            if acc.account_type in ['asset', 'expense']:
                acc.balance += (l.debit - l.credit)
            else:
                acc.balance += (l.credit - l.debit)
            session.add(acc)

    await session.commit()
    await session.refresh(entry)
    
    return JournalEntryResponse(**entry.model_dump(), created_by_name=user.full_name)

async def enrich_journal(entry: JournalEntry, session: AsyncSession) -> JournalEntryResponse:
    u_name = None
    if entry.created_by:
        u = await session.get(User, entry.created_by)
        if u: u_name = u.full_name
    resp_lines = []
    for l in entry.lines:
        acc = await session.get(Account, l['account_id'])
        resp_lines.append(JournalLineResponse(
            **l,
            account_code=acc.code if acc else None,
            account_name=acc.name if acc else None
        ))
    return JournalEntryResponse(**entry.model_dump(), created_by_name=u_name, lines=resp_lines)

@router.get("/admin/journal-entries/{entry_id}", response_model=JournalEntryResponse)
async def get_journal_entry(entry_id: str, session: AsyncSession = Depends(get_session), user=Depends(get_current_user)):
    entry = await session.get(JournalEntry, entry_id)
    if not entry: raise HTTPException(status_code=404, detail="Journal entry not found")
    return await enrich_journal(entry, session)

@router.post("/admin/journal-entries/{entry_id}/post")
async def post_journal_entry(entry_id: str, session: AsyncSession = Depends(get_session), user=Depends(require_admin)):
    entry = await session.get(JournalEntry, entry_id)
    if not entry: raise HTTPException(status_code=404, detail="Journal entry not found")
    if entry.status == 'posted': return {"message": "Already posted"}

    # Update account balances
    for l in entry.lines:
        acc = await session.get(Account, l['account_id'])
        if acc:
            if acc.account_type in ['asset', 'expense']:
                acc.balance += (l['debit'] - l['credit'])
            else:
                acc.balance += (l['credit'] - l['debit'])
            session.add(acc)

    entry.status = 'posted'
    entry.posted_at = get_vn_time()
    session.add(entry)
    await session.commit()
    return {"message": "Journal entry posted"}

@router.delete("/admin/journal-entries/{entry_id}")
async def delete_journal_entry(entry_id: str, session: AsyncSession = Depends(get_session), user=Depends(require_admin)):
    entry = await session.get(JournalEntry, entry_id)
    if not entry: raise HTTPException(status_code=404, detail="Journal entry not found")
    if entry.status == 'posted':
        # Reverse account balances
        for l in entry.lines:
            acc = await session.get(Account, l['account_id'])
            if acc:
                if acc.account_type in ['asset', 'expense']:
                    acc.balance -= (l['debit'] - l['credit'])
                else:
                    acc.balance -= (l['credit'] - l['debit'])
                session.add(acc)
    await session.delete(entry)
    await session.commit()
    return {"message": "Journal entry deleted"}

# ==================== REPORTS ROUTES ====================

@router.get("/admin/reports/trial-balance")
async def get_trial_balance(session: AsyncSession = Depends(get_session), user=Depends(get_current_user)):
    stmt = select(Account).where(Account.is_header == False).order_by(Account.code)
    accounts = (await session.exec(stmt)).all()
    
    res = []
    total_dr = 0
    total_cr = 0
    
    for a in accounts:
        if a.balance != 0:
            if a.account_type in ['asset', 'expense']:
                dr = a.balance if a.balance > 0 else 0
                cr = abs(a.balance) if a.balance < 0 else 0
            else:
                cr = a.balance if a.balance > 0 else 0
                dr = abs(a.balance) if a.balance < 0 else 0
            
            res.append({
                "account_code": a.code,
                "account_name": a.name,
                "debit": dr,
                "credit": cr
            })
            total_dr += dr
            total_cr += cr
            
    return {
        "accounts": res,
        "total_debit": total_dr,
        "total_credit": total_cr
    }

@router.get("/admin/reports/inventory-valuation")
async def get_inventory_valuation(warehouse_id: Optional[str] = None, session: AsyncSession = Depends(get_session), user=Depends(get_current_user)):
    stmt = select(StockBalance)
    if warehouse_id:
        stmt = stmt.where(StockBalance.warehouse_id == warehouse_id)
    balances = (await session.exec(stmt)).all()

    items = []
    total_value = 0
    for sb in balances:
        prod = await session.get(Product, sb.product_id)
        wh = await session.get(Warehouse, sb.warehouse_id)
        value = sb.quantity * sb.avg_cost
        total_value += value
        items.append({
            "product_id": sb.product_id,
            "product_name": prod.name if prod else "",
            "product_sku": prod.sku if prod else "",
            "warehouse_id": sb.warehouse_id,
            "warehouse_name": wh.name if wh else "",
            "quantity": sb.quantity,
            "avg_cost": sb.avg_cost,
            "total_value": round(value, 0)
        })

    return {
        "items": items,
        "total_value": round(total_value, 0)
    }

@router.get("/admin/reports/profit-loss")
async def get_profit_loss(session: AsyncSession = Depends(get_session), user=Depends(get_current_user)):
    stmt = select(Account).where(Account.account_type.in_(['revenue', 'expense'])).order_by(Account.code)
    accounts = (await session.exec(stmt)).all()

    revenue_items = []
    expense_items = []
    total_revenue = 0
    total_expense = 0

    for a in accounts:
        if a.balance == 0:
            continue
        item = {"account_code": a.code, "account_name": a.name, "amount": abs(a.balance)}
        if a.account_type == 'revenue':
            revenue_items.append(item)
            total_revenue += abs(a.balance)
        else:
            expense_items.append(item)
            total_expense += abs(a.balance)

    return {
        "revenue": revenue_items,
        "expense": expense_items,
        "total_revenue": round(total_revenue, 0),
        "total_expense": round(total_expense, 0),
        "net_profit": round(total_revenue - total_expense, 0)
    }
