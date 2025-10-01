import frappe
from frappe import _

@frappe.whitelist()
def get_gate_outward_list(name=None, party=None):
    """
    Fetch Gate Outward documents not yet linked with a Sales Invoice.
    """
    filters = {"linked_sales_invoice": ["is", "not set"],"docstatus": 1}   # exclude already linked

    if name:
        filters["name"] = name
    if party:
        filters["party"] = party

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


