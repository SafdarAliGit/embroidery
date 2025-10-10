// Copyright (c) 2025, Safdar Ali and contributors
// For license information, please see license.txt

frappe.ui.form.on("Gate Outward", {
    refresh(frm) {
        // Set filter on child table item link
        frm.set_query("item", "gate_outward_item", function() {
            return {
                filters: {
                    item_group: "Fabric For Embroidery"
                }
            };
        });
    },

    gate_pass(frm) {
        const parent_name = frm.doc.gate_pass;

        if (!parent_name) {
            // Clear child rows if gate_pass is removed
            frm.clear_table("gate_outward_item");
            frm.refresh_field("gate_outward_item");
            return;
        }

        frappe.call({
            method: "embroidery.api.fetch_gate_pass_items",
            args: {
                parent_name: parent_name
            },
            callback(r) {
                if (r.message) {
                    const items = r.message;
                    // Reset child table
                    frm.clear_table("gate_outward_item");

                    for (let d of items) {
                        const row = frm.add_child("gate_outward_item");
                        row.item = d.item;
                        row.design_no = d.design_no;
                        row.qty = d.qty;
                        row.uom = d.uom;
                        row.color = d.color;
                        row.lot_no = d.lot_no;
                        row.stitches = d.stitches;
                        row.embroidery_type = d.embroidery_type;
                        row.constant = d.constant;
                        row.description = d.description;
                        row.item_name = d.item_name;
                        row.income_account = d.income_account;

                        // After setting fields, compute rate/amount
                        calculate_rate_for_row(frm, row, d);  
                    }

                    frm.refresh_field("gate_outward_item");
                    // Also refresh total, in case calculated in callback
                }
            },
            error: function(err) {
                console.error("Error fetching gate pass items:", err);
            }
        });
    }
});

frappe.ui.form.on("Gate Outward Item", {
    embroidery_type: on_child_field_change,
    stitches: on_child_field_change,
    constant: on_child_field_change,
    qty: on_child_field_change
});

function on_child_field_change(frm, cdt, cdn) {
    calculate_rate(frm, cdt, cdn);
}

/**
 * Calculate rate & amount for one child row, then recalc total.
 */
function calculate_rate(frm, cdt, cdn) {
    const row = locals[cdt][cdn];
    if (!row) return;

    let rate = 0.0;
    let amount = 0.0;

    if (row.embroidery_type === "Alternate" || row.embroidery_type === "Folding") {
        if (row.stitches != null && row.constant != null) {
            rate = (row.stitches / 1000) * row.constant;
        }
    } else if (row.embroidery_type === "Sheet") {
        if (row.stitches != null && row.constant != null) {
            rate = (row.stitches * 3 / 1000) * row.constant;
        }
    }

    if (rate && row.qty != null) {
        amount = rate * row.qty;
    }

    frappe.model.set_value(cdt, cdn, "rate", rate);
    frappe.model.set_value(cdt, cdn, "amount", amount);

    // Recompute grand total
    let total_amount = 0.0;
    frm.doc.gate_outward_item.forEach(r => {
        total_amount += (r.amount || 0);
    });
    frm.set_value("total_amount", total_amount);
}

/**
 * For newly fetched rows, we may want to compute rate immediately.
 * This variant accepts a data dict (the server returned row), but it's optional.
 */
function calculate_rate_for_row(frm, row, d) {
    // Since the row object is the child doc instance (not cdt/cdn), let's convert:
    const { doctype, name } = row;
    calculate_rate(frm, doctype, name);
}
