# OTNT ERP System

**Project Status**: Active Development (Week 6/8)
**Current Focus**: Repair & Warranty Module

## Overview
A comprehensive ERP solution designed specifically for Robot Vacuum businesses, managing the full lifecycle of products from import to sales, warranty, and repair.

## Key Modules
- **Foundation**: Auth, RBAC, Multi-branch/Warehouse structure.
- **Product Master**: Robots, Accessories, Parts management.
- **Inventory Core**: FIFO/Average Costing, Stock Ledger, Real-time Balance.
- **Serial Tracking**: Individual tracking for Robots (IMEI/Serial).
- **Sales & POS**: Serial allocation, Warranty activation, Automated Journal Entries.
- **Accounting**: Built-in Double-entry Ledger (VAS Standard), Automated Posting from Ops.
- **Repair (In Progress)**: Ticket management, Diagnosis, Parts consumption.

## Documentation
- **[Master Plan & Roadmap](PROJECT_MASTER_PLAN.md)**: Detailed status of all modules.
- **[Archived Docs](archived/)**: Previous checklists and requirements.

## Tech Stack
- **Backend**: Python (FastAPI) + MongoDB (Motor)
- **Frontend**: React + Tailwind CSS
- **Infrastructure**: Docker Ready
