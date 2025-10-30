frappe.ui.form.on("Sales Invoice", {
    refresh: function (frm) {
        frm.add_custom_button(
            __("Fetch From Gate Outward"),
            function () {
                open_gate_outward_dialog(frm);
            },
            __("Get Items From")
        );
    }
});

function open_gate_outward_dialog(frm) {
    let d = new frappe.ui.Dialog({
        title: "Select Gate Outward",
        size: "large",
        fields: [
            {
                fieldname: "filters_section",
                fieldtype: "Section Break",
                label: "Filters"
            },
            {
                fieldname: "name",
                label: "Gate Outward",
                fieldtype: "Link",
                options: "Gate Outward",
                onchange: () => load_gate_outwards(d)
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
                onchange: () => load_gate_outwards(d)
            },
            {
                fieldname: "cb3",
                label: "",
                fieldtype: "Column Break",
               
            },
            {
                fieldname: "lot_no",
                label: "Lot No",
                fieldtype: "Link",
                options: "Batch",
                onchange: () => load_gate_outwards(d)
            },
            {
                fieldname: "sb",
                fieldtype: "Section Break"
            },
            {
                fieldname: "gate_outward_list",
                fieldtype: "HTML"
            }
        ],
        primary_action_label: "Fetch Child Items",
        primary_action() {
            let selected = [];
            d.get_field("gate_outward_list").$wrapper
                .find('input[type="checkbox"]:checked')
                .each(function () {
                    selected.push($(this).val());
                });

            if (selected.length === 0) {
                frappe.msgprint("Please select at least one Gate Outward.");
                return;
            }

            frappe.call({
                method: "embroidery.api.get_gate_outward_items",
                args: { gate_outward_names: selected },
                callback: function (r) {
                    if (r.message) {
                        let items = r.message;
                        let si_items = frm.doc.items || [];

                        // ✅ Remove first empty row if present
                        if (si_items.length === 1 && !si_items[0].item_code) {
                            frm.clear_table("items");
                        }

                        // ✅ Add fetched items
                        items.forEach(it => {
                            let row = frm.add_child("items");
                            row.item_code = it.item;
                            row.design_no = it.design_no;
                            row.qty = it.qty;
                            row.uom = it.uom;
                            row.color = it.color;
                            row.batch_no = it.lot_no;
                            row.stitches = it.stitches;
                            row.rate = it.rate;
                            row.amount = it.amount;
                            row.embroidery_type = it.embroidery_type;
                            row.constant = it.constant;
                            row.gate_outward = it.parent;
                            row.income_account = it.income_account;
                            row.item_name = it.item_name;
                            row.description = it.description;
                        });

                        frm.refresh_field("items");
                        d.hide();
                    }
                }
            });
        }
    });

    // Load Gate Outward list initially
    load_gate_outwards(d);
    d.show();
}

function load_gate_outwards(d) {
    let name = d.get_value("name");
    let party = d.get_value("party");
    let lot_no = d.get_value("lot_no");

    frappe.call({
        method: "embroidery.api.get_gate_outward_list",
        args: { name: name, party: party, lot_no: lot_no },
        callback: function (r) {
            if (r.message) {
                let $wrap = d.get_field("gate_outward_list").$wrapper;
                $wrap.empty();

                let html = `
                    <table class="table table-bordered" id="gate-outward-table">
                        <thead>
                            <tr>
                                <th>
                                  <input type="checkbox" id="select-all-gate-outwards" />
                                </th>
                                <th>Gate Outward</th>
                                <th>Date</th>
                                <th>Customer</th>
                            </tr>
                        </thead>
                        <tbody>
                `;

                r.message.forEach(go => {
                    html += `
                        <tr>
                            <td><input class="child-gate-outward-checkbox" type="checkbox" value="${go.name}"></td>
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
                $wrap.find("#select-all-gate-outwards").on("change", function () {
                    let checked = this.checked;
                    $wrap.find(".child-gate-outward-checkbox").each(function () {
                        this.checked = checked;
                    });
                });

                // Optionally: if all child boxes are manually checked/un-checked, reflect that in Select All
                $wrap.find(".child-gate-outward-checkbox").on("change", function () {
                    let all = $wrap.find(".child-gate-outward-checkbox");
                    let checkedCount = all.filter(":checked").length;
                    let selAll = $wrap.find("#select-all-gate-outwards")[0];
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

