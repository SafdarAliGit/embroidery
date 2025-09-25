// Copyright (c) 2025, Safdar Ali and contributors
// For license information, please see license.txt

frappe.ui.form.on("Gate Inward", {
	refresh(frm) {
        frm.set_query("item","gate_inward_item", function() {
            return {
                filters: {
                    item_group: "Fabric For Embroidery"
                }
            };
        });
        frm.set_query("lot_no", "gate_inward_item", function(doc, cdt, cdn) {
            var child = locals[cdt][cdn];
            return {
                filters: {
                    "item": child.item
                }
            };
        });
	},

});



