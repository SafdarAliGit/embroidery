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

        // Default to 0
        let rate = 0;

        // Apply conditions
        if (row.embroidery_type === "Alternate" || row.embroidery_type === "Folding") {
            rate = (row.stitches / 1000) * row.constant;
        } else if (row.embroidery_type === "Sheet") {
            rate = ((row.stitches * 3) / 1000) * row.constant * 1;
        } else {
            rate = 0;
        }

        // Set value in child table row
        frappe.model.set_value(cdt, cdn, "rate", rate);
        frappe.model.set_value(cdt, cdn, "amount", row.rate * row.qty || 0);
}


