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
        frm.add_custom_button(
            __("Fetch From Gate Pass"),
            function () {
                open_gate_pass_dialog(frm);
            }
        );
    },

    // gate_pass(frm) {
    //     const parent_name = frm.doc.gate_pass;

    //     if (!parent_name) {
    //         // Clear child rows if gate_pass is removed
    //         frm.clear_table("gate_outward_item");
    //         frm.refresh_field("gate_outward_item");
    //         return;
    //     }

    //     frappe.call({
    //         method: "embroidery.api.fetch_gate_pass_items",
    //         args: {
    //             parent_name: parent_name
    //         },
    //         callback(r) {
    //             if (r.message) {
    //                 const items = r.message;
    //                 // Reset child table
    //                 frm.clear_table("gate_outward_item");

    //                 for (let d of items) {
    //                     const row = frm.add_child("gate_outward_item");
    //                     row.item = d.item;
    //                     row.design_no = d.design_no;
    //                     row.qty = d.qty;
    //                     row.uom = d.uom;
    //                     row.color = d.color;
    //                     row.lot_no = d.lot_no;
    //                     row.stitches = d.stitches;
    //                     row.embroidery_type = d.embroidery_type;
    //                     row.constant = d.constant;
    //                     row.description = d.description;
    //                     row.item_name = d.item_name;
    //                     row.income_account = d.income_account;

    //                     // After setting fields, compute rate/amount
    //                     calculate_rate_for_row(frm, row, d);  
    //                 }

    //                 frm.refresh_field("gate_outward_item");
    //                 // Also refresh total, in case calculated in callback
    //             }
    //         },
    //         error: function(err) {
    //             console.error("Error fetching gate pass items:", err);
    //         }
    //     });
    // }
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



// ---------
function open_gate_pass_dialog(frm) {
    let d = new frappe.ui.Dialog({
        title: "Select Gate Pass",
        size: "large",
        fields: [
            {
                fieldname: "filters_section",
                fieldtype: "Section Break",
                label: "Filters"
            },
            {
                fieldname: "name",
                label: "Gate Pass",
                fieldtype: "Link",
                options: "Gate Pass",
                onchange: () => load_gate_pass_list(d)
            },
            {
                fieldname: "cb2",
                label: "",
                fieldtype: "Column Break",
               
            },
            
            {
                fieldname: "party",
                label: "Customer",
                fieldtype: "Link",
                options: "Customer",
                onchange: () => load_gate_pass_list(d)
            },
            {
                fieldname: "sb",
                fieldtype: "Section Break"
            },
            {
                fieldname: "gate_pass_list",
                fieldtype: "HTML"
            }
        ],
        primary_action_label: "Fetch Child Items",
        primary_action() {
            let selected = [];
            d.get_field("gate_pass_list").$wrapper
                .find('input[type="checkbox"]:checked')
                .each(function () {
                    selected.push($(this).val());
                });

            if (selected.length === 0) {
                frappe.msgprint("Please select at least one Gate Pass.");
                return;
            }

            frappe.call({
                method: "embroidery.api.get_gate_pass_items",
                args: { gate_pass_names: selected },
                callback: function (r) {
                    if (r.message) {
                        let items = r.message;
                        let si_items = frm.doc.items || [];

                        // ✅ Remove first empty row if present
                        if (si_items.length === 1 && !si_items[0].item_code) {
                            frm.clear_table("gate_outward_item");
                        }

                        // ✅ Add fetched items
                        items.forEach(it => {
                            let row = frm.add_child("gate_outward_item");
                            row.item_code = it.item;
                            row.design_no = it.design_no;
                            row.qty = it.qty;
                            row.uom = it.uom;
                            row.color = it.color;
                            row.lot_no = it.lot_no;
                            row.stitches = it.stitches;
                            row.embroidery_type = it.embroidery_type;
                            row.constant = it.constant;
                            row.income_account = it.income_account;
                            row.item_name = it.item_name;
                            row.description = it.description;
                            row.gate_pass = it.parent;
                            calculate_rate_for_row(frm, row, it);  
                        });

                        frm.refresh_field("gate_outward_item");
                        d.hide();
                    }
                }
            });
        }
    });

    // Load Gate Outward list initially
    load_gate_pass_list(d);
    d.show();
}

function load_gate_pass_list(d) {
    let name = d.get_value("name");
    let party = d.get_value("party");

    frappe.call({
        method: "embroidery.api.get_gate_pass_list",
        args: { name: name, party: party },
        callback: function (r) {
            if (r.message) {
                let $wrap = d.get_field("gate_pass_list").$wrapper;
                $wrap.empty();

                let html = `
                    <table class="table table-bordered" id="gate-outward-table">
                        <thead>
                            <tr>
                                <th>
                                  <input type="checkbox" id="select-all-gate-passes" />
                                </th>
                                <th>Gate Pass</th>
                                <th>Date</th>
                                <th>Customer</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                r.message.forEach(go => {
                    html += `
                        <tr>
                            <td><input class="child-gate-pass-checkbox" type="checkbox" value="${go.name}"></td>
                            <td>${go.name}</td>
                            <td>${go.date}</td>
                            <td>${go.party || ""}</td>
                        </tr>
                    `;
                });

                html += `
                        </tbody>
                    </table>
                `;
                $wrap.html(html);

                // After HTML is in DOM, bind event handlers

                // “Select All” checkbox
                $wrap.find("#select-all-gate-passes").on("change", function () {
                    let checked = this.checked;
                    $wrap.find(".child-gate-pass-checkbox").each(function () {
                        this.checked = checked;
                    });
                });

                // Optionally: if all child boxes are manually checked/un-checked, reflect that in Select All
                $wrap.find(".child-gate-pass-checkbox").on("change", function () {
                    let all = $wrap.find(".child-gate-pass-checkbox");
                    let checkedCount = all.filter(":checked").length;
                    let selAll = $wrap.find("#select-all-gate-passes")[0];
                    if (checkedCount === all.length) {
                        selAll.checked = true;
                    } else {
                        selAll.checked = false;
                    }
                });
            }
        }
    });
}

