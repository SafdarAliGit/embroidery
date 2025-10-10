import frappe
from frappe.model.document import Document

class GatePass(Document):

    def before_save(self):
        """Set default income_account on child items before save."""
        # Prefer company from the document itself
        company = getattr(self, "company", None) or frappe.defaults.get_user_default("Company")
        if not company:
            return

        income_account = frappe.db.get_value("Company", company, "default_income_account")
        if not income_account:
            return

        # Loop over child items
        for item in self.get("gate_pass_item") or []:
            # Only set if it's empty / not already set
            if not item.get("income_account"):
                item.income_account = income_account
