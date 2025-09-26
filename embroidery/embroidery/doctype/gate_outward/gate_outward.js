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
    },
    qty: function(frm, cdt, cdn) {
        calculate_rate(frm, cdt, cdn);
    }
});

function calculate_rate(frm, cdt, cdn) {
    let row = locals[cdt][cdn];

    let rate = 0;
    let total_amount = 0;

    if (row.embroidery_type === "Alternate" || row.embroidery_type === "Folding") {
        rate = (row.stitches / 1000) * row.constant;
    } else if (row.embroidery_type === "Sheet") {
        rate = (row.stitches * 3 / 1000) * row.constant;
    }

    let amount = rate * row.qty;

    frappe.model.set_value(cdt, cdn, {
        rate: rate,
        amount: amount
    });
    frm.doc.gate_outward_item.forEach(function(row) {
        total_amount += row.amount || 0;
    });
    frm.set_value("total_amount", total_amount);
}
