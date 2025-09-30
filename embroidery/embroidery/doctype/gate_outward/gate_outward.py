# Copyright (c) 2025, Safdar Ali and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe import _

class GateOutward(Document):
    def on_update(self):
        # Prefer company from the document itself
        company = frappe.defaults.get_user_default("Company")
        if not company:
            return

        income_account = frappe.db.get_value("Company", company, "default_income_account")
        if not income_account:
            return

        for item in self.gate_outward_item:
            if not item.income_account:  # only set if empty
                item.income_account = income_account

			
			
		

