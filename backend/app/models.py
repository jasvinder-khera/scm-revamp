from sqlalchemy import Column, Date, DateTime, Float, Index, Integer, JSON, SmallInteger, String, TIMESTAMP, Table, Text, Time, text
from sqlalchemy.dialects.mysql import BIGINT, INTEGER, MEDIUMTEXT, TEXT, VARCHAR
from sqlalchemy.orm import Mapped, declarative_base, mapped_column
from sqlalchemy.orm.base import Mapped
from .database import Base
metadata = Base.metadata


class AdminLoc(Base):
    __tablename__ = 'admin_loc'
    __table_args__ = (
        Index('admin', 'admin'),
        Index('loc', 'loc')
    )

    id = mapped_column(Integer, primary_key=True)
    loc = mapped_column(Integer)
    admin = mapped_column(Integer)
    df = mapped_column(Integer, server_default=text("'0'"))


class ApprovalMatrix(Base):
    __tablename__ = 'approval_matrix'
    __table_args__ = (
        Index('approver_id', 'approver_id'),
        Index('cm_func_approval_ibfk_2', 'cc1'),
        Index('cm_func_id', 'function_id'),
        Index('group_field_id', 'group_field_id'),
        Index('sub_group_field_id', 'sub_group_field_id')
    )

    approval_matrix_id = mapped_column(Integer, primary_key=True)
    group_field_id = mapped_column(Integer)
    sub_group_field_id = mapped_column(Integer)
    function_id = mapped_column(Integer)
    approver_id = mapped_column(Integer)
    cc1 = mapped_column(Integer)
    df = mapped_column(Integer, server_default=text("'0'"))


class ApprovalStat(Base):
    __tablename__ = 'approval_stat'
    __table_args__ = (
        Index('approval_status_id', 'approval_status_id'),
        Index('created_by', 'created_by'),
        Index('id', 'id'),
        Index('modifier_id', 'modifier_id'),
        Index('old_approval_status_id', 'old_approval_status_id'),
        Index('old_pr_status_id', 'old_pr_status_id'),
        Index('pr_status_id', 'pr_status_id'),
        Index('updated_by', 'updated_by')
    )

    stat_id = mapped_column(Integer, primary_key=True)
    pur_req_hdr_id = mapped_column(Integer, comment='PR Header ID')
    prno = mapped_column(String(50), comment='PR/Ticket Number')
    id = mapped_column(Integer, comment='Requester ID')
    modifier_id = mapped_column(Integer, comment='Approver ID')
    old_approval_status_id = mapped_column(Integer, comment='Old Approval Status : 1-Not Initiated; 2-Pending for Approval; 3-Approved; 4-Not Approved')
    old_pr_status_id = mapped_column(Integer, comment='Old PR Status: 1-Draft; 2-Rejected; 3-In Process; 4-PO Released; 5-Material Received; 6-Payment Received; Closed Successfully')
    approval_status_id = mapped_column(Integer, comment='New Approval Status: 1-Not Initiated; 2-Pending for Approval; 3-Approved; 4-Not Approved')
    pr_status_id = mapped_column(Integer, comment='New PR Status: 1-Draft; 2-Rejected; 3-In Process; 4-PO Released; 5-Material Received; 6-Payment Received; Closed Successfully')
    flag = mapped_column(Integer, comment='0=Active; 1=Inactive')
    pr_df = mapped_column(Integer, server_default=text("'0'"))
    appr_status_rem = mapped_column(TEXT)
    scm_status_rem = mapped_column(String(200), comment='Buyer Remarks')
    obj_id = mapped_column(String(24))
    created_at = mapped_column(Date, comment='Create: Date & Time')
    created_by = mapped_column(Integer, comment='Created By')
    updated_at = mapped_column(DateTime, comment='Modified: Date & Time')
    updated_by = mapped_column(Integer, comment='Modified By')


class Attachments(Base):
    __tablename__ = 'attachments'

    attachment_id = mapped_column(Integer, primary_key=True)
    name = mapped_column(String(300))
    pur_req_hdr_id = mapped_column(Integer)
    obj_id = mapped_column(String(24))
    created_at = mapped_column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))
    created_by = mapped_column(Integer)
    updated_at = mapped_column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))
    updated_by = mapped_column(Integer)
    df = mapped_column(Integer)


class AvgTatAnalysis(Base):
    __tablename__ = 'avg_tat_analysis'
    __table_args__ = (
        Index('buyer_id', 'buyer_id'),
    )

    tat_id = mapped_column(Integer, primary_key=True)
    month_id = mapped_column(Integer)
    month_name = mapped_column(String(30))
    year = mapped_column(Integer)
    buyer_id = mapped_column(Integer)
    buyer_name = mapped_column(String(50))
    avg_tat = mapped_column(Integer)
    created_by = mapped_column(Integer)
    created_at = mapped_column(Date)
    updated_by = mapped_column(Integer)
    updated_at = mapped_column(Date)
    df = mapped_column(Integer, server_default=text("'0'"))


class AvgTatSegAnalysis(Base):
    __tablename__ = 'avg_tat_seg_analysis'
    __table_args__ = (
        Index('month_id', 'month_id', 'month_name'),
        Index('segment_id', 'segment_id')
    )

    tat_id = mapped_column(Integer, primary_key=True)
    month_id = mapped_column(Integer)
    month_name = mapped_column(String(30))
    year = mapped_column(Integer)
    segment_id = mapped_column(Integer)
    segment_name = mapped_column(String(50))
    avg_tat = mapped_column(Integer)
    created_by = mapped_column(Integer)
    created_at = mapped_column(Date)
    updated_by = mapped_column(Integer)
    updated_at = mapped_column(Date)
    df = mapped_column(Integer, server_default=text("'0'"))


class CmApprovalStatus(Base):
    __tablename__ = 'cm_approval_status'

    approval_status_id = mapped_column(Integer, primary_key=True)
    apr_stat_descrip = mapped_column(String(30))
    created_at = mapped_column(DateTime)
    created_by = mapped_column(Integer)
    updated_at = mapped_column(DateTime)
    updated_by = mapped_column(Integer)
    df = mapped_column(Integer)


class CmCostcentr(Base):
    __tablename__ = 'cm_costcentr'

    cm_costcentr_id = mapped_column(Integer, primary_key=True)
    cost_center = mapped_column(String(10), nullable=False)
    description = mapped_column(String(40), nullable=False)
    obj_id = mapped_column(String(24))
    created_at = mapped_column(DateTime, server_default=text('CURRENT_TIMESTAMP'))
    created_by = mapped_column(Integer)
    updated_at = mapped_column(DateTime)
    updated_by = mapped_column(Integer)
    df = mapped_column(Integer, server_default=text("'0'"))


class CmCustomer(Base):
    __tablename__ = 'cm_customer'

    cm_cus_id = mapped_column(Integer, primary_key=True)
    cus_code = mapped_column(String(10))
    title = mapped_column(String(30))
    name1 = mapped_column(String(80))
    name2 = mapped_column(String(80))
    name3 = mapped_column(String(80))
    name4 = mapped_column(String(80))
    srch_term1 = mapped_column(String(40))
    srch_term2 = mapped_column(String(40))
    street1 = mapped_column(String(100))
    street2 = mapped_column(String(100))
    street3 = mapped_column(String(100))
    street4 = mapped_column(String(100))
    street5 = mapped_column(String(100))
    city = mapped_column(String(30))
    region = mapped_column(String(10))
    region_text = mapped_column(String(30))
    post_code = mapped_column(String(10))
    ctr = mapped_column(String(5))
    ctr_text = mapped_column(String(30))
    tel_no = mapped_column(String(12))
    mob_no = mapped_column(String(30))
    email = mapped_column(String(40))
    created_at = mapped_column(TIMESTAMP)
    created_by = mapped_column(Integer)
    updated_at = mapped_column(TIMESTAMP)
    updatedbyt = mapped_column(Integer)
    df = mapped_column(Integer)


class CmDc(Base):
    __tablename__ = 'cm_dc'
    __table_args__ = (
        Index('buyer_id', 'buyer_id'),
        Index('created_by', 'created_by'),
        Index('updated_by', 'updated_by')
    )

    dc_id = mapped_column(Integer, primary_key=True)
    doc_no = mapped_column(VARCHAR(50))
    doc_type = mapped_column(Integer, comment='1: Returnable ; 2: Non-Returnable')
    closed = mapped_column(Integer, server_default=text("'0'"), comment='0: Open; 1: Closed')
    prod_type = mapped_column(Integer, comment='1 - Non-Stock Consumables ; 2 - Asset/Capital Goods ; 3 - Promotional Items')
    doc_date = mapped_column(VARCHAR(20))
    appr_name = mapped_column(VARCHAR(30))
    cnee_name = mapped_column(VARCHAR(255))
    cnee_addrs = mapped_column(VARCHAR(255))
    cnee_addrs2 = mapped_column(VARCHAR(255))
    cnee_addrs3 = mapped_column(VARCHAR(40))
    cnee_pin = mapped_column(Integer)
    cnee_gstn = mapped_column(VARCHAR(200))
    ship_to_addrs = mapped_column(MEDIUMTEXT)
    cnor_name = mapped_column(VARCHAR(50))
    cnor_addrs = mapped_column(VARCHAR(100))
    cnor_addrs2 = mapped_column(VARCHAR(40))
    cnor_addrs3 = mapped_column(VARCHAR(40))
    cnor_pin = mapped_column(Integer)
    cnor_gstn = mapped_column(VARCHAR(200))
    dsptch_frm_addrs = mapped_column(VARCHAR(100))
    total_exp = mapped_column(VARCHAR(50))
    cgst = mapped_column(VARCHAR(50))
    sgst = mapped_column(VARCHAR(50))
    igst = mapped_column(VARCHAR(50))
    grand_tot = mapped_column(VARCHAR(50))
    remarks = mapped_column(MEDIUMTEXT)
    attachment = mapped_column(VARCHAR(20))
    dc_file = mapped_column(VARCHAR(30))
    closure_status = mapped_column(Integer, server_default=text("'2'"), comment='1:Closed; 2:Open')
    closure_date = mapped_column(VARCHAR(20))
    buyer_id = mapped_column(Integer)
    obj_id = mapped_column(VARCHAR(24))
    created_at = mapped_column(Date)
    created_by = mapped_column(Integer)
    updated_at = mapped_column(DateTime)
    updated_by = mapped_column(Integer)
    df = mapped_column(Integer)
    ship_to_name = mapped_column(VARCHAR(200))
    ship_to_add = mapped_column(TEXT)
    ship_to_add_pin = mapped_column(VARCHAR(200))
    ship_to_add_gst = mapped_column(VARCHAR(200))
    ship_from_name = mapped_column(VARCHAR(200))
    ship_from_add = mapped_column(VARCHAR(200))
    ship_from_add_pin = mapped_column(VARCHAR(200))
    ship_from_add_gst = mapped_column(VARCHAR(200))


class CmDcLine(Base):
    __tablename__ = 'cm_dc_line'
    __table_args__ = (
        Index('dc_id', 'dc_id'),
    )

    dc_line_id = mapped_column(Integer, primary_key=True)
    dc_id = mapped_column(Integer, nullable=False)
    prod_name = mapped_column(String(50))
    prod_des = mapped_column(String(100))
    hsn_code = mapped_column(String(30))
    uom = mapped_column(String(5))
    qty = mapped_column(String(20))
    unit_val = mapped_column(String(50))
    txbl_tot = mapped_column(String(50))
    cgst_rate = mapped_column(String(50))
    cgst_amt = mapped_column(String(50))
    sgst_rate = mapped_column(String(50))
    sgst_amt = mapped_column(String(50))
    igst_rate = mapped_column(String(50))
    igst_amt = mapped_column(String(50))
    line_tot = mapped_column(String(50))
    obj_id = mapped_column(String(24))
    created_at = mapped_column(Date)
    created_by = mapped_column(Integer)
    updated_at = mapped_column(Date)
    updated_by = mapped_column(Integer)
    df = mapped_column(Integer)


class CmFunc(Base):
    __tablename__ = 'cm_func'
    __table_args__ = (
        Index('cm_segment_id', 'cm_segment_id'),
    )

    cm_func_id = mapped_column(Integer, primary_key=True)
    cm_segment_id = mapped_column(Integer, nullable=False)
    descptn = mapped_column(String(50), nullable=False)
    created_at = mapped_column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    created_by = mapped_column(Integer, nullable=False)
    df = mapped_column(Integer, nullable=False)
    obj_id = mapped_column(String(24))
    updated_at = mapped_column(DateTime)
    updated_by = mapped_column(Integer)


class CmFuncApproval(Base):
    __tablename__ = 'cm_func_approval'
    __table_args__ = (
        Index('approver_id', 'approver_id'),
        Index('cm_func_approval_ibfk_2', 'cc1'),
        Index('cm_func_id', 'cm_func_id')
    )

    cm_func_approval_id = mapped_column(Integer, primary_key=True)
    cm_func_id = mapped_column(Integer)
    approver_id = mapped_column(Integer)
    cc1 = mapped_column(Integer)


class CmMaterial(Base):
    __tablename__ = 'cm_material'

    cm_mat_id = mapped_column(Integer, primary_key=True)
    material = mapped_column(String(20), nullable=False)
    mat_descrip = mapped_column(String(50))
    mat_type = mapped_column(String(10))
    mat_type_descrip = mapped_column(String(50))
    mat_grp = mapped_column(String(12))
    mat_old_num = mapped_column(String(20))
    cm_uom_id = mapped_column(Integer)
    prod_hier = mapped_column(String(20))
    created_at = mapped_column(TIMESTAMP)
    created_by = mapped_column(Integer)
    updated_at = mapped_column(TIMESTAMP)
    updated_by = mapped_column(Integer)
    df = mapped_column(Integer)


class CmPlant(Base):
    __tablename__ = 'cm_plant'

    cm_plnt_id = mapped_column(Integer, primary_key=True)
    plnt_code = mapped_column(String(4), nullable=False)
    plnt_details = mapped_column(String(30), nullable=False)
    created_at = mapped_column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    created_by = mapped_column(Integer, nullable=False)
    df = mapped_column(Integer, nullable=False)
    plant_short_code = mapped_column(String(50))
    obj_id = mapped_column(String(24))
    updated_at = mapped_column(DateTime)
    updated_by = mapped_column(Integer)


class CmPrStatus(Base):
    __tablename__ = 'cm_pr_status'

    pr_status_id = mapped_column(Integer, primary_key=True)
    pr_stat_descrip = mapped_column(String(50))
    created_at = mapped_column(DateTime)
    created_by = mapped_column(Integer)
    updated_at = mapped_column(DateTime)
    updated_by = mapped_column(Integer)
    df = mapped_column(Integer)


class CmSegment(Base):
    __tablename__ = 'cm_segment'

    cm_segment_id = mapped_column(Integer, primary_key=True)
    created_at = mapped_column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    created_by = mapped_column(Integer, nullable=False)
    df = mapped_column(Integer, nullable=False)
    descptn = mapped_column(String(30))
    obj_id = mapped_column(String(24))
    updated_at = mapped_column(DateTime)
    updated_by = mapped_column(Integer)


class CmStateCode(Base):
    __tablename__ = 'cm_state_code'

    state_code_id = mapped_column(Integer, primary_key=True)
    state_name = mapped_column(String(50))
    state_code = mapped_column(String(2))


class CmUom(Base):
    __tablename__ = 'cm_uom'

    cm_uom_id = mapped_column(Integer, primary_key=True)
    uom = mapped_column(String(3), nullable=False)
    uom_text = mapped_column(String(30), nullable=False)
    created_at = mapped_column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    created_by = mapped_column(Integer, nullable=False)
    obj_id = mapped_column(String(24))
    updated_at = mapped_column(DateTime)
    updated_by = mapped_column(Integer)
    df = mapped_column(Integer)


class CmVndr(Base):
    __tablename__ = 'cm_vndr'

    cm_vndr_id = mapped_column(Integer, primary_key=True)
    vndr_code = mapped_column(String(10))
    title = mapped_column(String(30))
    name1 = mapped_column(String(80))
    name2 = mapped_column(String(80))
    name3 = mapped_column(String(80))
    name4 = mapped_column(String(80))
    srch_term1 = mapped_column(String(40))
    srch_term2 = mapped_column(String(40))
    street1 = mapped_column(String(100))
    street2 = mapped_column(String(100))
    street3 = mapped_column(String(100))
    street4 = mapped_column(String(100))
    street5 = mapped_column(String(100))
    district = mapped_column(String(30))
    city = mapped_column(String(30))
    region = mapped_column(String(10))
    region_text = mapped_column(String(30))
    post_code = mapped_column(String(10))
    ctr = mapped_column(String(5))
    tel_no = mapped_column(String(12))
    mob_no = mapped_column(String(30))
    email = mapped_column(String(40))
    created_at = mapped_column(TIMESTAMP)
    created_by = mapped_column(Integer)
    updated_at = mapped_column(TIMESTAMP)
    updated_by = mapped_column(Integer)
    df = mapped_column(Integer)


class FamilyDayUsers(Base):
    __tablename__ = 'family_day_users'

    id = mapped_column(Integer, primary_key=True)
    filename = mapped_column(Text)
    name = mapped_column(Text)
    email = mapped_column(Text)
    mail_status = mapped_column(String(20))
    mail_date = mapped_column(Date)
    mail_time = mapped_column(Time)


class Func(Base):
    __tablename__ = 'func'
    __table_args__ = (
        Index('group_field', 'group_field_id'),
        Index('sub_group_field_id', 'sub_group_field_id')
    )

    function_id = mapped_column(Integer, primary_key=True)
    group_field_id = mapped_column(Integer)
    sub_group_field_id = mapped_column(Integer)
    descptn = mapped_column(String(100))
    df = mapped_column(Integer)


class GroupField(Base):
    __tablename__ = 'group_field'

    group_field_id = mapped_column(Integer, primary_key=True)
    created_at = mapped_column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    created_by = mapped_column(Integer, nullable=False)
    df = mapped_column(Integer, nullable=False)
    descptn = mapped_column(String(30))
    obj_id = mapped_column(String(24))
    updated_at = mapped_column(DateTime)
    updated_by = mapped_column(Integer)


class InwardEntryAnxr1(Base):
    __tablename__ = 'inward_entry_anxr1'
    __table_args__ = (
        Index('created_by', 'created_by'),
        Index('updated_by', 'updated_by')
    )

    gate_entry_id = mapped_column(Integer, primary_key=True)
    entry_no = mapped_column(String(50))
    po_no = mapped_column(String(250), comment='PO Number')
    entry_date = mapped_column(Date)
    in_time = mapped_column(Time)
    supplier = mapped_column(Text)
    vehicle_no = mapped_column(Text)
    driver = mapped_column(Text)
    guard_name = mapped_column(String(100))
    remarks = mapped_column(Text)
    remarks_admin = mapped_column(Text)
    attachment = mapped_column(String(100))
    created_by = mapped_column(Integer)
    created_at = mapped_column(Date)
    created_at_time = mapped_column(Time)
    updated_by = mapped_column(Integer)
    updated_at = mapped_column(Date)
    updated_at_time = mapped_column(Time)
    is_return = mapped_column(String(200))
    return_date = mapped_column(Date)
    return_time = mapped_column(Time)
    return_comment = mapped_column(Text)
    df = mapped_column(Integer, server_default=text("'0'"))


class InwardEntryAnxr1Line(Base):
    __tablename__ = 'inward_entry_anxr1_line'
    __table_args__ = (
        Index('created_by', 'created_by'),
        Index('inward_entry_id', 'inward_entry_id'),
        Index('updated_by', 'updated_by')
    )

    id = mapped_column(Integer, primary_key=True)
    inward_entry_id = mapped_column(Integer)
    pur_req_line_id = mapped_column(Integer)
    pr_po_no = mapped_column(String(250))
    line_item_no = mapped_column(Integer)
    material_code = mapped_column(VARCHAR(100))
    material = mapped_column(Text)
    qty = mapped_column(Integer)
    challan_no = mapped_column(String(70))
    challan_date = mapped_column(Date)
    created_by = mapped_column(Integer)
    created_at = mapped_column(Date)
    created_at_time = mapped_column(Time)
    updated_by = mapped_column(Integer)
    updated_at = mapped_column(Date)
    updated_at_time = mapped_column(Time)
    df = mapped_column(Integer)
    ge_df = mapped_column(Integer)
    uomType = mapped_column(String(255))


class InwardGateEntry(Base):
    __tablename__ = 'inward_gate_entry'
    __table_args__ = (
        Index('entry_by', 'entry_by'),
        Index('group_field_id', 'group_field_id'),
        Index('handover_to', 'handover_to'),
        Index('location_id', 'location_id')
    )

    gate_entry_id = mapped_column(Integer, primary_key=True)
    entry_no = mapped_column(String(50))
    entry_date = mapped_column(Date)
    entry_time = mapped_column(Time)
    entry_by = mapped_column(String(30))
    eway_bill = mapped_column(String(20))
    wi = mapped_column(Integer, comment='Warehouse Incharge')
    supplier = mapped_column(String(100))
    docket = mapped_column(String(20))
    courier = mapped_column(Text)
    challan_date = mapped_column(Date)
    pono = mapped_column(Text)
    group_field_id = mapped_column(Integer)
    location_id = mapped_column(Integer)
    handover_to = mapped_column(Integer)
    remarks = mapped_column(Text)
    created_at = mapped_column(DateTime)
    created_by = mapped_column(Integer)
    df = mapped_column(Integer, server_default=text("'0'"))


class InwardGateEntryLine(Base):
    __tablename__ = 'inward_gate_entry_line'
    __table_args__ = (
        Index('gate_entry_id', 'gate_entry_id'),
    )

    gate_entry_line_id = mapped_column(Integer, primary_key=True)
    gate_entry_id = mapped_column(Integer)
    prod_no = mapped_column(String(12))
    inv_no = mapped_column(String(30))
    material = mapped_column(Text)
    qty = mapped_column(Integer)
    remarks = mapped_column(Text)
    created_at = mapped_column(DateTime)
    created_by = mapped_column(Integer)
    updated_at = mapped_column(DateTime)
    updated_by = mapped_column(Integer)
    df = mapped_column(Integer, server_default=text("'0'"))


class LinkAprstatPrstat(Base):
    __tablename__ = 'link_aprstat_prstat'
    __table_args__ = (
        Index('approval_status_id', 'approval_status_id'),
        Index('pr_status_id', 'pr_status_id')
    )

    link_aprstat_prstat_id = mapped_column(Integer, primary_key=True)
    approval_status_id = mapped_column(Integer, nullable=False)
    pr_status_id = mapped_column(Integer, nullable=False)


class Log(Base):
    __tablename__ = 'log'

    log_id = mapped_column(Integer, primary_key=True)
    object = mapped_column(String(24), nullable=False)
    date = mapped_column(Date, nullable=False)
    time = mapped_column(TIMESTAMP, nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    userid = mapped_column(Integer, nullable=False)


class LogD(Base):
    __tablename__ = 'log_d'

    id = mapped_column(Integer, primary_key=True)
    log_id = mapped_column(Integer, nullable=False)
    old_value = mapped_column(String(100), nullable=False)
    new_value = mapped_column(String(100), nullable=False)
    colmn = mapped_column(String(100))


class LogTraceDc(Base):
    __tablename__ = 'log_trace_dc'

    log_id = mapped_column(Integer, primary_key=True)
    table_name = mapped_column(Text, comment='Name of the table whose value(s) is/are modified')
    main_id = mapped_column(Integer, comment='Primary key of the table in which modification is made')
    col_name = mapped_column(Text, comment='Name of the column whose value is modified')
    old_val = mapped_column(Text, comment='Old/Original Value')
    new_val = mapped_column(Text, comment='New/Modified Value')
    action = mapped_column(Text, comment='Which action/reason led to this update')
    updated_at = mapped_column(Date)
    updated_at_time = mapped_column(Time)
    updated_by = mapped_column(Integer)


class LogTraceGe(Base):
    __tablename__ = 'log_trace_ge'

    log_id = mapped_column(Integer, primary_key=True)
    table_name = mapped_column(String(50), comment='Name of the table whose value(s) is/are modified')
    col_name = mapped_column(String(20), comment='Name of the column whose value is modified')
    main_id = mapped_column(Integer, comment='Primary key of the table in which modification is made')
    old_val = mapped_column(Text, comment='Old/Original Value')
    new_val = mapped_column(Text, comment='New/Modified Value')
    updated_at = mapped_column(Date)
    updated_at_time = mapped_column(Time)
    updated_by = mapped_column(Integer)


class LogTracePr(Base):
    __tablename__ = 'log_trace_pr'

    log_id = mapped_column(Integer, primary_key=True)
    table_name = mapped_column(Text, comment='Name of the table whose value(s) is/are modified')
    main_id = mapped_column(Integer, comment='Primary key of the table in which modification is made')
    col_name = mapped_column(Text, comment='Name of the column whose value is modified')
    old_val = mapped_column(Text, comment='Old/Original Value')
    new_val = mapped_column(Text, comment='New/Modified Value')
    action = mapped_column(Text, comment='Which action led to this update')
    updated_at = mapped_column(Date)
    updated_at_time = mapped_column(Time)
    updated_by = mapped_column(Integer)


class LoginTrack(Base):
    __tablename__ = 'login_track'
    __table_args__ = (
        Index('user_id', 'user_id'),
    )

    log_id = mapped_column(Integer, primary_key=True)
    user_id = mapped_column(Integer)
    login_time = mapped_column(DateTime)
    logout_time = mapped_column(DateTime)
    obj_id = mapped_column(String(24))


class Migrations(Base):
    __tablename__ = 'migrations'

    id = mapped_column(INTEGER, primary_key=True)
    migration = mapped_column(VARCHAR(255), nullable=False)
    batch = mapped_column(Integer, nullable=False)


class NonRetGatePass(Base):
    __tablename__ = 'non_ret_gate_pass'

    gate_pass_id = mapped_column(Integer, primary_key=True)
    gate_pass_no = mapped_column(String(10))
    consignee_copy_no = mapped_column(String(20))
    date = mapped_column(Date)
    consignee = mapped_column(String(30))
    plant = mapped_column(String(30))
    group_field = mapped_column(Integer)
    purpose = mapped_column(String(50))
    cash_rec_no = mapped_column(String(10))
    dated = mapped_column(Date)
    vehicle_no = mapped_column(String(20))
    carrier_rec_name = mapped_column(String(30))
    prepared_by = mapped_column(String(30))
    auth_by = mapped_column(String(30))
    created_by = mapped_column(Integer)
    created_at = mapped_column(Date)
    created_at_time = mapped_column(Time)
    updated_by = mapped_column(Integer)
    updated_at = mapped_column(Date)
    updated_at_time = mapped_column(Time)
    df = mapped_column(Integer)


class NonRetGatePassLine(Base):
    __tablename__ = 'non_ret_gate_pass_line'

    line_id = mapped_column(Integer, primary_key=True)
    gate_pass_id = mapped_column(Integer)
    material = mapped_column(String(50))
    unit = mapped_column(Integer)
    qty = mapped_column(Integer)
    pkg_no = mapped_column(Integer)
    approx_val = mapped_column(Integer)
    rem = mapped_column(String(50))
    created_by = mapped_column(Integer)
    created_at = mapped_column(Date)
    created_at_time = mapped_column(Time)
    updated_by = mapped_column(Integer)
    updated_at = mapped_column(Date)
    updated_at_time = mapped_column(Time)
    df = mapped_column(Integer)
    gp_df = mapped_column(Integer)


class OutwardEntryAnxr3(Base):
    __tablename__ = 'outward_entry_anxr3'
    __table_args__ = (
        Index('created_by', 'created_by'),
        Index('group_field', 'group_field'),
        Index('updated_by', 'updated_by')
    )

    gate_out_entry_id = mapped_column(Integer, primary_key=True)
    entry_no = mapped_column(String(200))
    entry_date = mapped_column(Date)
    out_time = mapped_column(Time)
    group_field = mapped_column(Integer)
    dc_type = mapped_column(Integer, comment='1 - SCM Portal; 2 - SAP')
    dc_no = mapped_column(Text)
    consignee = mapped_column(String(50), comment='Dispatched To')
    vehicle_no = mapped_column(Text)
    auth_by = mapped_column(String(20))
    takenout_by = mapped_column(String(255))
    security = mapped_column(String(255))
    remarks = mapped_column(Text)
    attachment = mapped_column(String(100))
    created_at = mapped_column(Date)
    created_by = mapped_column(Integer)
    created_at_time = mapped_column(Time)
    updated_at = mapped_column(Date)
    updated_by = mapped_column(Integer)
    updated_by_time = mapped_column(Time)
    df = mapped_column(Integer)


class OutwardEntryAnxr3Line(Base):
    __tablename__ = 'outward_entry_anxr3_line'
    __table_args__ = (
        Index('created_by', 'created_by'),
        Index('inward_entry_id', 'outward_entry_id'),
        Index('updated_by', 'updated_by')
    )

    id = mapped_column(Integer, primary_key=True)
    outward_entry_id = mapped_column(Integer)
    material = mapped_column(String(50))
    qty = mapped_column(String(100))
    created_by = mapped_column(Integer)
    created_at = mapped_column(Date)
    created_at_time = mapped_column(Time)
    updated_by = mapped_column(Integer)
    updated_at = mapped_column(Date)
    updated_at_time = mapped_column(Time)
    df = mapped_column(Integer)
    ge_df = mapped_column(Integer)
    uomType = mapped_column(String(200))


class OutwardEntryAnxr3New(Base):
    __tablename__ = 'outward_entry_anxr3_new'
    __table_args__ = (
        Index('created_by', 'created_by'),
        Index('group_field', 'group_field'),
        Index('updated_by', 'updated_by')
    )

    gate_out_entry_id = mapped_column(Integer, primary_key=True)
    entry_no = mapped_column(String(10))
    entry_date = mapped_column(Date)
    out_time = mapped_column(Time)
    group_field = mapped_column(Integer)
    dc_type = mapped_column(Integer, comment='1 - SCM Portal; 2 - SAP')
    dc_no = mapped_column(Text)
    consignee = mapped_column(String(50), comment='Dispatched To')
    vehicle_no = mapped_column(Text)
    auth_by = mapped_column(String(20))
    takenout_by = mapped_column(String(20))
    security = mapped_column(String(20))
    remarks = mapped_column(Text)
    attachment = mapped_column(String(100))
    created_at = mapped_column(Date)
    created_by = mapped_column(Integer)
    created_at_time = mapped_column(Time)
    updated_at = mapped_column(Date)
    updated_by = mapped_column(Integer)
    updated_by_time = mapped_column(Time)
    df = mapped_column(Integer)


class OutwardEntryAnxr5(Base):
    __tablename__ = 'outward_entry_anxr5'
    __table_args__ = (
        Index('created_by', 'created_by'),
        Index('group_field', 'group_field'),
        Index('updated_by', 'updated_by')
    )

    gate_out_entry_id = mapped_column(Integer, primary_key=True)
    entry_no = mapped_column(String(10))
    entry_date = mapped_column(Date)
    out_time = mapped_column(Time)
    group_field = mapped_column(Integer)
    dc_type = mapped_column(Integer, comment='1- SCM Portal ; 2 - SAP')
    dc_no = mapped_column(Text)
    consignee = mapped_column(Text, comment='Dispatched To')
    vehicle_no = mapped_column(Text)
    auth_by = mapped_column(String(20))
    takenout_by = mapped_column(String(20))
    security = mapped_column(String(20))
    return_date = mapped_column(Date)
    return_time = mapped_column(Time)
    carrier = mapped_column(String(20))
    remarks = mapped_column(Text)
    attachment = mapped_column(String(100))
    status = mapped_column(Integer, server_default=text("'1'"), comment='0 - Closed ; 1 - Open')
    date_of_return = mapped_column(Date)
    time_of_return = mapped_column(Time)
    remarks_at_return = mapped_column(Text)
    created_at = mapped_column(Date)
    created_by = mapped_column(Integer)
    created_at_time = mapped_column(Time)
    updated_at = mapped_column(Date)
    updated_by = mapped_column(Integer)
    updated_by_time = mapped_column(Time)
    df = mapped_column(Integer)


class OutwardEntryAnxr5Line(Base):
    __tablename__ = 'outward_entry_anxr5_line'
    __table_args__ = (
        Index('created_by', 'created_by'),
        Index('inward_entry_id', 'outward_entry_id'),
        Index('updated_by', 'updated_by')
    )

    id = mapped_column(Integer, primary_key=True)
    outward_entry_id = mapped_column(Integer)
    material = mapped_column(String(200))
    qty = mapped_column(Integer)
    created_by = mapped_column(Integer)
    created_at = mapped_column(Date)
    created_at_time = mapped_column(Time)
    updated_by = mapped_column(Integer)
    updated_at = mapped_column(Date)
    updated_at_time = mapped_column(Time)
    df = mapped_column(Integer)
    ge_df = mapped_column(Integer)
    uomType = mapped_column(String(255))


class PageVisitLogs(Base):
    __tablename__ = 'page_visit_logs'
    __table_args__ = (
        Index('idx_created_at', 'created_at'),
        Index('idx_route_name', 'route_name'),
        Index('idx_user_id', 'user_id')
    )

    id = mapped_column(BIGINT, primary_key=True)
    method = mapped_column(String(10), nullable=False)
    url = mapped_column(Text, nullable=False)
    user_id = mapped_column(BIGINT)
    email = mapped_column(String(200))
    route_name = mapped_column(String(255))
    ip_address = mapped_column(String(45))
    user_agent = mapped_column(Text)
    referer = mapped_column(Text)
    status_code = mapped_column(SmallInteger)
    request_data = mapped_column(JSON)
    created_at = mapped_column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))
    updated_at = mapped_column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))


t_password_resets = Table(
    'password_resets', metadata,
    Column('email', VARCHAR(255), nullable=False),
    Column('token', VARCHAR(255), nullable=False),
    Column('created_at', TIMESTAMP),
    Index('password_resets_email_index', 'email')
)


class PlantLinkWi(Base):
    __tablename__ = 'plant_link_wi'
    __table_args__ = (
        Index('plant_id', 'plant_id'),
        Index('wi_id', 'wi_id')
    )

    id = mapped_column(Integer, primary_key=True)
    df = mapped_column(Integer, nullable=False, server_default=text("'0'"))
    plant_id = mapped_column(Integer, comment='Plant')
    wi_id = mapped_column(Integer, comment='Warehouse Incharge')
    wi_name = mapped_column(String(30))


class PlantSecurityGuards(Base):
    __tablename__ = 'plant_security_guards'
    __table_args__ = (
        Index('plant_id', 'plant_id'),
        Index('wi_id', 'guard_name')
    )

    id = mapped_column(Integer, primary_key=True)
    df = mapped_column(Integer, nullable=False, server_default=text("'0'"))
    plant_id = mapped_column(Integer, comment='Plant')
    guard_name = mapped_column(String(30))


class PrLineDeletions(Base):
    __tablename__ = 'pr_line_deletions'

    id = mapped_column(Integer, primary_key=True)
    prno = mapped_column(Integer, nullable=False)
    line_id = mapped_column(Integer, nullable=False)
    created_at = mapped_column(TIMESTAMP, nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    remark = mapped_column(TEXT)
    created_by = mapped_column(Integer)
    status = mapped_column(Integer, server_default=text("'0'"))
    approve_by = mapped_column(Integer)
    approve_at = mapped_column(TIMESTAMP)


class PurReqHdr(Base):
    __tablename__ = 'pur_req_hdr'
    __table_args__ = (
        Index('cm_segment_id', 'cm_segment_id'),
        Index('func_descrip', 'functn'),
        Index('group_field', 'group_field'),
        Index('id', 'id')
    )

    pur_req_hdr_id = mapped_column(Integer, primary_key=True)
    company_type = mapped_column(String(100), nullable=False)
    id = mapped_column(Integer)
    prno = mapped_column(String(50))
    pr_date = mapped_column(Date)
    cm_segment_id = mapped_column(Integer)
    group_field = mapped_column(Integer)
    functn = mapped_column(Integer)
    hin_use = mapped_column(String(10))
    hin_use_clarify = mapped_column(Text)
    resale = mapped_column(String(3))
    resale_cus_name = mapped_column(String(50))
    po_num = mapped_column(String(100))
    back_char = mapped_column(String(10))
    deliv_adrc = mapped_column(String(20))
    othr_adrc = mapped_column(String(100))
    pr_total = mapped_column(String(100))
    attch_doc = mapped_column(String(255))
    pr_rem = mapped_column(Text)
    pr_subject = mapped_column(Text)
    pr_priority = mapped_column(Integer)
    pr_purpose = mapped_column(String(255))
    project_no = mapped_column(String(200))
    pr_approver_id = mapped_column(Integer)
    pr_buyer = mapped_column(String(30))
    cc2 = mapped_column(String(30))
    extra_col = mapped_column(Integer, server_default=text("'9999'"))
    obj_id = mapped_column(String(24))
    created_at = mapped_column(TIMESTAMP)
    created_by = mapped_column(Integer)
    updated_at = mapped_column(TIMESTAMP)
    updated_by = mapped_column(Integer)
    df = mapped_column(Integer)


class PurReqHdrNew(Base):
    __tablename__ = 'pur_req_hdr_new'
    __table_args__ = (
        Index('cm_segment_id', 'sub_group_field_id'),
        Index('created_by', 'created_by'),
        Index('func_descrip', 'functn'),
        Index('group_field_id', 'group_field_id'),
        Index('id', 'id'),
        Index('pr_approver_id', 'pr_approver_id'),
        Index('pr_buyer', 'pr_buyer'),
        Index('updated_by', 'updated_by')
    )

    pur_req_hdr_id = mapped_column(Integer, primary_key=True)
    company_type = mapped_column(String(100), nullable=False)
    id = mapped_column(Integer)
    prno = mapped_column(String(50))
    pr_date = mapped_column(Date)
    group_field_id = mapped_column(Integer, comment='Group Field')
    sub_group_field_id = mapped_column(Integer, comment='cm_segment_id')
    functn = mapped_column(Integer, comment='functn')
    pr_approver_id = mapped_column(Integer)
    pr_buyer = mapped_column(Integer)
    cc2 = mapped_column(String(30))
    pr_subject = mapped_column(Text)
    pr_purpose = mapped_column(String(255))
    pr_priority = mapped_column(Integer)
    attch_doc = mapped_column(String(255))
    pr_rem = mapped_column(TEXT)
    pr_total = mapped_column(String(100))
    hin_use = mapped_column(String(10))
    hin_use_clarify = mapped_column(Text)
    resale = mapped_column(String(3))
    resale_cus_name = mapped_column(String(50))
    po_num = mapped_column(String(100))
    back_char = mapped_column(String(10))
    deliv_adrc = mapped_column(Text)
    othr_adrc = mapped_column(Text)
    project_no = mapped_column(String(200))
    extra_col = mapped_column(Integer, server_default=text("'9999'"))
    obj_id = mapped_column(String(24))
    created_at = mapped_column(TIMESTAMP)
    created_by = mapped_column(Integer)
    updated_at = mapped_column(TIMESTAMP)
    updated_by = mapped_column(Integer)
    df = mapped_column(Integer)
    approval_status_id = mapped_column(Integer)
    pr_status_id = mapped_column(Integer)
    approve_date = mapped_column(Date)
    approve_by = mapped_column(Integer)
    po_release_date = mapped_column(String(200))


class PurReqHdrNewCopy(Base):
    __tablename__ = 'pur_req_hdr_new_copy'
    __table_args__ = (
        Index('cm_segment_id', 'sub_group_field_id'),
        Index('created_by', 'created_by'),
        Index('func_descrip', 'functn'),
        Index('group_field_id', 'group_field_id'),
        Index('id', 'id'),
        Index('pr_approver_id', 'pr_approver_id'),
        Index('pr_buyer', 'pr_buyer'),
        Index('updated_by', 'updated_by')
    )

    pur_req_hdr_id = mapped_column(Integer, primary_key=True)
    id = mapped_column(Integer)
    prno = mapped_column(String(50))
    pr_date = mapped_column(Date)
    group_field_id = mapped_column(Integer, comment='Group Field')
    sub_group_field_id = mapped_column(Integer, comment='cm_segment_id')
    functn = mapped_column(Integer, comment='functn')
    pr_approver_id = mapped_column(Integer)
    pr_buyer = mapped_column(Integer)
    cc2 = mapped_column(String(30))
    pr_subject = mapped_column(Text)
    pr_purpose = mapped_column(String(255))
    pr_priority = mapped_column(Integer)
    attch_doc = mapped_column(String(255))
    pr_rem = mapped_column(Text)
    pr_total = mapped_column(String(100))
    hin_use = mapped_column(String(10))
    hin_use_clarify = mapped_column(Text)
    resale = mapped_column(String(3))
    resale_cus_name = mapped_column(String(50))
    po_num = mapped_column(String(100))
    back_char = mapped_column(String(10))
    deliv_adrc = mapped_column(Text)
    othr_adrc = mapped_column(Text)
    project_no = mapped_column(String(200))
    extra_col = mapped_column(Integer, server_default=text("'9999'"))
    obj_id = mapped_column(String(24))
    created_at = mapped_column(TIMESTAMP)
    created_by = mapped_column(Integer)
    updated_at = mapped_column(TIMESTAMP)
    updated_by = mapped_column(Integer)
    df = mapped_column(Integer)
    approval_status_id = mapped_column(Integer)
    pr_status_id = mapped_column(Integer)
    approve_date = mapped_column(String(200))
    approve_by = mapped_column(Integer)


class PurReqLine(Base):
    __tablename__ = 'pur_req_line'
    __table_args__ = (
        Index('cm_plnt_id', 'cm_plnt_id'),
        Index('cm_uom_id', 'cm_uom_id'),
        Index('pur_req_line_ibfk_4', 'cm_mat_id')
    )

    pur_req_line_id = mapped_column(Integer, primary_key=True)
    pur_req_hdr_id = mapped_column(Integer)
    line_item = mapped_column(Integer)
    item_type = mapped_column(VARCHAR(50))
    cm_plnt_id = mapped_column(Integer)
    mat_detail = mapped_column(MEDIUMTEXT)
    part_no = mapped_column(VARCHAR(30))
    cm_uom_id = mapped_column(Integer)
    cm_mat_id = mapped_column(VARCHAR(200))
    item_quan = mapped_column(Integer)
    grn_qty = mapped_column(Integer)
    received_qty = mapped_column(Integer)
    item_unitp = mapped_column(Float)
    item_row_total = mapped_column(Float)
    exp_deliv = mapped_column(VARCHAR(255))
    item_remarks = mapped_column(MEDIUMTEXT)
    po_no = mapped_column(VARCHAR(250), comment='PO Number')
    po_rls_date = mapped_column(Date, comment='PO Released Date')
    po_creation_date = mapped_column(Date)
    po_exp_date = mapped_column(Date)
    po_status = mapped_column(VARCHAR(100), comment='PO Status [0:open - PR Closed ; 1:close - PO Closed]')
    po_action = mapped_column(VARCHAR(100), comment='PO Action [0:PO Released ; 1:Material Received]\t')
    obj_id = mapped_column(VARCHAR(24))
    created_at = mapped_column(Date)
    created_by = mapped_column(Integer)
    updated_at = mapped_column(Date)
    updated_by = mapped_column(Integer)
    df = mapped_column(Integer, server_default=text("'0'"))
    pr_df = mapped_column(Integer, server_default=text("'0'"))


class Reminders(Base):
    __tablename__ = 'reminders'

    rem_id = mapped_column(Integer, primary_key=True)
    dc_id = mapped_column(Integer)
    sent_status = mapped_column(Integer)
    created_at = mapped_column(Date)


class RetGatePass(Base):
    __tablename__ = 'ret_gate_pass'

    gate_pass_id = mapped_column(Integer, primary_key=True)
    gate_pass_no = mapped_column(String(10))
    consignee_copy_no = mapped_column(String(20))
    date = mapped_column(Date)
    consignee = mapped_column(String(30))
    plant = mapped_column(Integer)
    group_field = mapped_column(Integer)
    purpose = mapped_column(String(50))
    exp_dt_rt = mapped_column(Date, comment='Expected Date of Return')
    vehicle_no = mapped_column(String(20))
    carrier_rec_name = mapped_column(String(30))
    prepared_by = mapped_column(String(30))
    auth_by = mapped_column(String(30))
    return_date = mapped_column(Date)
    carrier_name = mapped_column(String(30))
    created_by = mapped_column(Integer)
    created_at = mapped_column(Date)
    created_at_time = mapped_column(Time)
    updated_by = mapped_column(Integer)
    updated_at = mapped_column(Date)
    updated_at_time = mapped_column(Time)
    df = mapped_column(Integer)


class RetGatePassLine(Base):
    __tablename__ = 'ret_gate_pass_line'

    line_id = mapped_column(Integer, primary_key=True)
    gate_pass_id = mapped_column(Integer)
    material = mapped_column(String(50))
    unit = mapped_column(Integer)
    qty = mapped_column(Integer)
    pkg_no = mapped_column(Integer)
    approx_val = mapped_column(Integer)
    rem = mapped_column(String(50))
    created_by = mapped_column(Integer)
    created_at = mapped_column(Date)
    created_at_time = mapped_column(Time)
    updated_by = mapped_column(Integer)
    updated_at = mapped_column(Date)
    updated_at_time = mapped_column(Time)
    df = mapped_column(Integer)
    gp_df = mapped_column(Integer)


class Signatures(Base):
    __tablename__ = 'signatures'
    __table_args__ = (
        Index('entry_id', 'entry_id'),
    )

    img_id = mapped_column(Integer, primary_key=True)
    entry_id = mapped_column(Integer)
    entry_no = mapped_column(String(200))
    type = mapped_column(Integer, comment='1-Anx1; 2-Anx2; 3-Anx3; 4-Anx4; 5-Anx5')
    name = mapped_column(String(30))
    df = mapped_column(Integer, server_default=text("'0'"))


class SignaturesGateEntry(Base):
    __tablename__ = 'signatures_gate_entry'
    __table_args__ = (
        Index('entry_id', 'entry_id'),
    )

    img_id = mapped_column(Integer, primary_key=True)
    entry_id = mapped_column(Integer)
    name = mapped_column(String(30))
    df = mapped_column(Integer, server_default=text("'0'"))


class StatusTrack(Base):
    __tablename__ = 'status_track'

    status_id = mapped_column(Integer, primary_key=True)
    pur_req_hdr_id = mapped_column(Integer, nullable=False, comment='pur_req_hdr_id')
    approval_status_id = mapped_column(Integer, nullable=False)
    pr_status_id = mapped_column(Integer, nullable=False)
    created_at = mapped_column(DateTime, nullable=False)
    created_by = mapped_column(Integer, nullable=False)
    flag = mapped_column(Integer, nullable=False, comment='0-Active, 1-In Active')


class SubGroupField(Base):
    __tablename__ = 'sub_group_field'
    __table_args__ = (
        Index('cm_segment_id', 'group_field_id'),
    )

    sub_group_field_id = mapped_column(Integer, primary_key=True)
    group_field_id = mapped_column(Integer, nullable=False)
    descptn = mapped_column(String(50), nullable=False)
    created_at = mapped_column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    created_by = mapped_column(Integer, nullable=False)
    df = mapped_column(Integer, nullable=False)
    obj_id = mapped_column(String(24))
    updated_at = mapped_column(DateTime)
    updated_by = mapped_column(Integer)


class UserLoginLogs(Base):
    __tablename__ = 'user_login_logs'
    __table_args__ = (
        Index('userId', 'userId'),
    )

    id = mapped_column(Integer, primary_key=True)
    userId = mapped_column(Integer, nullable=False)
    loggedInAt = mapped_column(DateTime, nullable=False, server_default=text('CURRENT_TIMESTAMP'))
    name = mapped_column(String(100))
    hin_id = mapped_column(String(20))
    email = mapped_column(String(100))
    role = mapped_column(Integer)
    ip_address = mapped_column(String(100))
    loggedOutAt = mapped_column(DateTime)
    autoLoggedOut = mapped_column(VARCHAR(20))
    session_id = mapped_column(String(100))


class Users(Base):
    __tablename__ = 'users'

    id = mapped_column(Integer, primary_key=True)
    email = mapped_column(VARCHAR(200))
    pass_ = mapped_column('pass', VARCHAR(200))
    fname = mapped_column(String(40))
    mname = mapped_column(String(40))
    lname = mapped_column(String(40))
    hin_id = mapped_column(String(40))
    phone_no = mapped_column(VARCHAR(100))
    doj = mapped_column(String(20))
    loctn = mapped_column(String(30))
    cm_segment_id = mapped_column(Integer)
    group_field_id = mapped_column(Integer)
    cm_costcentr_id = mapped_column(Integer)
    level = mapped_column(String(10))
    email_verified_at = mapped_column(TIMESTAMP)
    password = mapped_column(String(255))
    user_role = mapped_column(String(12), server_default=text("'0'"), comment='0: Requester, 1: Modifier, 2: Buyer, 3: System Admin')
    department_head = mapped_column(Integer)
    dc_admin = mapped_column(Integer)
    security_user = mapped_column(Integer)
    user_role_dc = mapped_column(Integer)
    remember_token = mapped_column(String(100))
    created_at = mapped_column(DateTime)
    created_by = mapped_column(Integer)
    updated_at = mapped_column(DateTime)
    updated_by = mapped_column(Integer)
    df = mapped_column(Integer, comment='Deletion Flag: Active = 0, Inactive = 1')
    otp = mapped_column(String(100))


class UsersOld(Base):
    __tablename__ = 'users_old_'
    __table_args__ = (
        Index('users_ibfk_1', 'cm_segment_id'),
    )

    id = mapped_column(Integer, primary_key=True)
    fname = mapped_column(String(40), nullable=False)
    hin_id = mapped_column(String(10))
    mname = mapped_column(String(40))
    lname = mapped_column(String(40))
    email = mapped_column(String(60))
    phone_no = mapped_column(String(12))
    doj = mapped_column(String(20))
    loctn = mapped_column(String(30))
    cm_segment_id = mapped_column(Integer)
    cm_func_id = mapped_column(Integer)
    cm_costcentr_id = mapped_column(Integer)
    level = mapped_column(String(10))
    email_verified_at = mapped_column(TIMESTAMP)
    password = mapped_column(String(255))
    user_role = mapped_column(String(12), server_default=text("'0'"), comment='0:requester 1:Modifier 2:Buyer \r\n3 : System Admin')
    user_role_dc = mapped_column(Integer)
    remember_token = mapped_column(String(100))
    created_at = mapped_column(TIMESTAMP)
    created_by = mapped_column(Integer)
    updated_at = mapped_column(TIMESTAMP)
    updated_by = mapped_column(Integer)
    df = mapped_column(Integer, comment='Deletion Flag : Active - 0; Inactive - 1')
