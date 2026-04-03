import Shift    from "../models/Shift.js";
import Sale     from "../models/Sale.js";
import AuditLog from "../models/AuditLog.js";

async function audit(req, action, description, meta = {}) {
  try { await AuditLog.create({ storeId: req.storeId, userId: req.user._id, username: req.user.username, action, description, meta }); } catch {}
}

/* GET /api/shifts/active  — current open shift for this user */
export const getActiveShift = async (req, res) => {
  try {
    const shift = await Shift.findOne({ storeId: req.storeId, userId: req.user._id, status: "open" })
      .sort({ openedAt: -1 });
    res.json(shift || null);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

/* GET /api/shifts — all shifts (admin) */
export const getShifts = async (req, res) => {
  try {
    const shifts = await Shift.find({ storeId: req.storeId })
      .sort({ openedAt: -1 })
      .limit(100)
      .populate("userId", "username");
    res.json(shifts);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

/* POST /api/shifts/open */
export const openShift = async (req, res) => {
  try {
    const existing = await Shift.findOne({ storeId: req.storeId, userId: req.user._id, status: "open" });
    if (existing) return res.status(400).json({ message: "You already have an open shift", shift: existing });

    const { openingFloat = 0 } = req.body;
    const shift = await Shift.create({
      storeId:      req.storeId,
      userId:       req.user._id,
      username:     req.user.username,
      openingFloat: +openingFloat,
      status:       "open",
    });

    await audit(req, "login", `Shift opened — float $${openingFloat}`, { shiftId: shift._id, openingFloat });
    res.status(201).json(shift);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

/* POST /api/shifts/:id/close */
export const closeShift = async (req, res) => {
  try {
    const shift = await Shift.findOne({ _id: req.params.id, storeId: req.storeId, status: "open" });
    if (!shift) return res.status(404).json({ message: "Shift not found or already closed" });

    const { closingCount, notes = "" } = req.body;

    /* aggregate sales since shift opened */
    const sales = await Sale.find({
      storeId:   req.storeId,
      userId:    shift.userId,
      createdAt: { $gte: shift.openedAt },
    });

    const totalSales    = sales.reduce((s, x) => s + x.total, 0);
    const totalOrders   = sales.length;
    const cashSales     = sales.filter(s => s.paymentMethod === "cash" || (s.splitPayments || []).some(p => p.method === "cash"))
                               .reduce((s, x) => {
                                 if (x.paymentMethod === "split") return s + (x.splitPayments.find(p => p.method === "cash")?.amount || 0);
                                 return x.paymentMethod === "cash" ? s + x.total : s;
                               }, 0);
    const cardSales     = sales.filter(s => s.paymentMethod === "card").reduce((s, x) => s + x.total, 0);
    const payLaterSales = sales.filter(s => s.paymentMethod === "paylater" || (s.splitPayments || []).some(p => p.method === "paylater"))
                               .reduce((s, x) => {
                                 if (x.paymentMethod === "split") return s + (x.splitPayments.find(p => p.method === "paylater")?.amount || 0);
                                 return x.paymentMethod === "paylater" ? s + x.total : s;
                               }, 0);
    const totalRefunds  = sales.reduce((s, x) => s + (x.totalRefunded || 0), 0);
    const netRevenue    = totalSales - totalRefunds;
    const expectedCash  = shift.openingFloat + cashSales - totalRefunds;
    const variance      = closingCount != null ? +closingCount - expectedCash : null;

    Object.assign(shift, {
      closedAt: new Date(),
      closingCount: closingCount != null ? +closingCount : null,
      expectedCash: +expectedCash.toFixed(2),
      variance:     variance != null ? +variance.toFixed(2) : null,
      totalSales:   +totalSales.toFixed(2),
      totalOrders,
      cashSales:    +cashSales.toFixed(2),
      cardSales:    +cardSales.toFixed(2),
      payLaterSales:+payLaterSales.toFixed(2),
      totalRefunds: +totalRefunds.toFixed(2),
      netRevenue:   +netRevenue.toFixed(2),
      notes,
      status: "closed",
    });
    await shift.save();

    await audit(req, "logout", `Shift closed — net $${netRevenue.toFixed(2)}, variance $${variance?.toFixed(2) ?? "N/A"}`,
      { shiftId: shift._id, netRevenue, variance });

    res.json(shift);
  } catch (e) { res.status(500).json({ message: e.message }); }
};