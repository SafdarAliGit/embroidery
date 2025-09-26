// Copyright (c) 2025, Safdar Ali and contributors
// For license information, please see license.txt

frappe.ui.form.on("Gate Outward", {
	refresh(frm) {
        frm.set_query("item","gate_outward_item", function() {
            return {
                filters: {
                    item_group: "Fabric For Embroidery"
                }
            };
        });
	},
});

frappe.ui.form.on("Gate Outward Item", {
    embroidery_type: function(frm, cdt, cdn) {
        calculate_rate(frm, cdt, cdn);
    },
    stitches: function(frm, cdt, cdn) {
        calculate_rate(frm, cdt, cdn);
    },
    constant: function(frm, cdt, cdn) {
        calculate_rate(frm, cdt, cdn);
    }
});

function calculate_rate(frm, cdt, cdn) {
    let row = locals[cdt][cdn];

    let stitches = Number(row.stitches) || 0;
    let constant = Number(row.constant) || 0;
    let qty = Number(row.qty) || 0;

    let rate = 0;

    if (row.embroidery_type === "Alternate" || row.embroidery_type === "Folding") {
        rate = (stitches / 1000) * constant;
    } else if (row.embroidery_type === "Sheet") {
        rate = (stitches * 3 / 1000) * constant;
    }

    let amount = rate * qty;

    frappe.model.set_value(cdt, cdn, {
        rate: rate,
        amount: amount
    });
}
