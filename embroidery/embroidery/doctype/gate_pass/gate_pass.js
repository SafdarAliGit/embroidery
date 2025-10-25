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
        frm.set_query("lot_no", "gate_pass_item", function(doc, cdt, cdn) {
    // cdn is the name of the current child row (e.g., '1234567890')
        const current_row = frappe.get_doc(cdt, cdn); 
        
        // Check if item_code is available in the current child row
        if (current_row.item) {
            return {
                filters: {
                    item: current_row.item
                }
            };
        }
        
        // Return empty filters if no item_code is found, so it shows all lots or none
        return { filters: {} };
        });
        },
});



frappe.ui.form.on("Gate Pass Item", {

    qty: function(frm, cdt, cdn) {
        total_qty(frm,);
    }
});
	

function total_qty(frm) {
    let total = 0;
    for (let i = 0; i < frm.doc.gate_pass_item.length; i++) {
        total += frm.doc.gate_pass_item[i].qty;
    }
    frm.set_value("total_qty", total);
}
    