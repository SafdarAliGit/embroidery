# Copyright (c) 2025, Safdar Ali and contributors
# For license information, please see license.txt
import frappe
from frappe.utils import nowdate
from frappe.model.document import Document


class GateInward(Document):
	
	def on_submit(self):
		
		for item in self.gate_inward_item:
			# Generate unique batch_id for each item row
			batch_id = None
			if self.lot_no:
				batch_id = f"{self.lot_no}-{item.idx}"

				# Create Batch document
				batch = frappe.new_doc("Batch")
				batch.item = item.item
				batch.batch_id = batch_id if batch_id else item.lot_no
				batch.stock_uom = item.uom
				batch.batch_qty = item.qty
				batch.insert()

				# Update lot_no in child row (Gate Inward Item)
				frappe.db.set_value(
					item.doctype,  # usually "Gate Inward Item"
					item.name,     # child row name (unique)
					"lot_no",      # fieldname in child
					batch.name     # set to created batch name or batch_id as you prefer
				)

		# Reload child table values after update
		self.reload()

		"""
		When Gate Inward is submitted, create a Stock Entry (Material Receipt)
		**only if** there isn't already a Stock Entry for this Gate Inward
		with docstatus != 2 (i.e. not cancelled) 
		"""

		# check if a stock entry already exists for this Gate Inward
		existing = frappe.db.get_value(
			"Stock Entry",
			{
				"custom_gate_inward": self.name,    # assume you have a link field "gate_inward" in Stock Entry
				"docstatus": ["!=", 2]       # not cancelled
			},
			"name"
		)

		if existing:
			# There is already a valid Stock Entry, so skip creation
			frappe.msgprint(f"Stock Entry {existing} already exists for Gate Inward {self.name}. Skipping creation.")
			return

		# If none exists, proceed to create a new one
		if not self.gate_inward_item:
			frappe.throw("No items in Gate Inward to create Stock Entry")
		se = frappe.new_doc("Stock Entry")
		se.stock_entry_type = "Material Receipt"
		se.posting_date = self.date
		se.remarks = f"Auto created from Gate Inward: {self.name}"
		se.custom_gate_inward = self.name

		for item_row in self.gate_inward_item:
			# logic: skip qty zero unless allow_zero_valuation
			se.append("items", {
				"item_code": item_row.item,
				"qty": item_row.qty,
				"uom": item_row.uom,
				"t_warehouse": self.source_warehouse,
				"batch_no": getattr(item_row, "lot_no", None),
				"allow_zero_valuation_rate": 1 if item_row.allow_zero_valuation else 0,
			})
		se.submit()
		frappe.msgprint(f"Stock Entry {se.name} created for Gate Inward {self.name}")

