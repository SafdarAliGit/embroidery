import frappe
from frappe import _

@frappe.whitelist()
def get_gate_outward_list(name=None, party=None, lot_no=None):
    filters = {
        "linked_sales_invoice": ["is", "not set"],
        "docstatus": 1
    }

    if name:
        filters["name"] = name
    if party:
        filters["party"] = party

    if lot_no:
        # query the child table first for parent names
        parent_names = [d.parent for d in frappe.get_all(
            "Gate Outward Item",
            filters={"lot_no": lot_no},
            fields=["parent"]
        )]
        if not parent_names:
            # nothing matches, return empty
            return []
        filters["name"] = ["in", parent_names]

    gate_outwards = frappe.get_all(
        "Gate Outward",
        filters=filters,
        fields=["name", "date", "party"]
    )
    return gate_outwards




@frappe.whitelist()
def get_gate_outward_items(gate_outward_names):
    """
    Fetch child items from selected Gate Outward(s).
    Args:
        gate_outward_names (list | str): One or more Gate Outward names
    Returns:
        list of dict: items with mapped fields for Sales Invoice child table
    """
    if isinstance(gate_outward_names, str):
        # If JS passes as JSON string
        import json
        gate_outward_names = json.loads(gate_outward_names)

    items = []
    for go_name in gate_outward_names:
        children = frappe.get_all(
            "Gate Outward Item",
            filters={"parent": go_name},
            fields=[
                "item",
                "design_no",
                "qty",
                "uom",
                "color",
                "lot_no",
                "stitches",
                "rate",
                "amount",
                "embroidery_type",
                "constant",
                "parent",
                "income_account",
                "item_name",
                "description"
            ]
        )
        items.extend(children)

    return items



def on_submit(doc, method):
    """
    When Sales Invoice is submitted, link selected Gate Outward(s).
    """
    gate_outwards = set()

    # Collect all Gate Outward from child rows
    for row in doc.items:
        if row.gate_outward:   # you may need to add this field in child table
            gate_outwards.add(row.gate_outward)

    for go in gate_outwards:
        frappe.db.set_value("Gate Outward", go, "linked_sales_invoice", doc.name)


def on_cancel(doc, method):
    """
    When Sales Invoice is cancelled, unlink Gate Outward(s).
    """
    gate_outwards = set()

    for row in doc.items:
        if row.gate_outward:
            gate_outwards.add(row.gate_outward)

    for go in gate_outwards:
        frappe.db.set_value("Gate Outward", go, "linked_sales_invoice", None)


def on_submit_gate_outward(doc, method):
    """
    When Sales Invoice is submitted, link selected Gate Outward(s).
    """
    gate_passes = set()

    # Collect all Gate Outward from child rows
    for row in doc.gate_outward_item:
        if row.gate_pass:   # you may need to add this field in child table
            gate_passes.add(row.gate_pass)

    for gp in gate_passes:
        frappe.db.set_value("Gate Pass", gp, "linked_gate_outward", doc.name)


def on_cancel_gate_outward(doc, method):
    """
    When Sales Invoice is cancelled, unlink Gate Outward(s).
    """
    gate_passes = set()

    for row in doc.gate_outward_item:
        if row.gate_pass:
            gate_passes.add(row.gate_pass)

    for gp in gate_passes:
        frappe.db.set_value("Gate Pass", gp, "linked_gate_outward", None)


@frappe.whitelist()
def fetch_gate_pass_items(parent_name):
    if not parent_name:
        return []

    items = frappe.db.get_list(
        "Gate Pass Item",
        filters={"parent": parent_name},
        fields=[
            "item", "design_no", "qty", "uom", "color", "lot_no",
            "stitches", "embroidery_type", "constant",
            "description", "item_name", "income_account"
        ],
        order_by="idx asc"
    )
    return items


@frappe.whitelist()
def get_gate_pass_list(name=None, party=None):
    """
    Fetch Gate Outward documents not yet linked with a Sales Invoice.
    """
    filters = {"linked_gate_outward": ["is", "not set"],"docstatus": 1}   # exclude already linked

    if name:
        filters["name"] = name
    if party:
        filters["party"] = party

    gate_passes = frappe.get_all(
        "Gate Pass",
        filters=filters,
        fields=["name", "date", "party"]
    )
    return gate_passes



@frappe.whitelist()
def get_gate_pass_items(gate_pass_names):
    """
    Fetch child items from selected Gate Pass(s).
    Args:
        gate_pass_names (list | str): One or more Gate Pass names
    Returns:
        list of dict: items with mapped fields for Sales Invoice child table
    """
    if isinstance(gate_pass_names, str):
        # If JS passes as JSON string
        import json
        gate_pass_names = json.loads(gate_pass_names)

    items = []
    for gp_name in gate_pass_names:
        children = frappe.get_all(
            "Gate Pass Item",
            filters={"parent": gp_name},
            fields=[
                 "item",
                 "design_no",
                 "qty",
                 "uom",
                 "color",
                 "lot_no",
                 "stitches",
                 "embroidery_type",
                 "constant",
                 "description",
                 "item_name",
                 "income_account",
                 "parent"
            ]
        )
        items.extend(children)

    return items
