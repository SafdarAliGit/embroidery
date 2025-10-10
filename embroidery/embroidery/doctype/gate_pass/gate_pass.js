// Copyright (c) 2025, Safdar Ali and contributors
// For license information, please see license.txt

frappe.ui.form.on("Gate Pass", {
	refresh(frm) {
        frm.set_query("item","gate_pass_item", function() {
            return {
                filters: {
                    item_group: "Fabric For Embroidery"
                }
            };
        });
	},
});

