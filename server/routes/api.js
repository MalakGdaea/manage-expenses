const express = require("express");
const mongoose = require("mongoose");
const moment = require("moment");
mongoose.connect("mongodb://localhost/expenseDB");
const Expense = require("../model/Expense");
const router = express.Router();

router.get("/expenses", function (req, res) {
  let startDate = req.query.d1;
  let endDate = req.query.d2;
  let query = getQueryBasedOnDates(startDate, endDate);
  Expense.find(query)
    .sort({ date: -1 })
    .then((expensesSortedByDate) => {
      res.send(expensesSortedByDate);
    });
});

const getQueryBasedOnDates = function (startDate, endDate) {
  if (!startDate) {
    return {};
  } else {
    startDate = moment(startDate).format("YYYY-MM-DD");
    if (endDate) {
      endDate = moment(endDate).format("YYYY-MM-DD");
    } else {
      endDate = moment().format("YYYY-MM-DD");
    }
    return {
      $and: [{ date: { $gt: startDate } }, { date: { $lte: endDate } }],
    };
  }
};

router.post("/expense", function (req, res) {
  let date = req.body.date
    ? moment(req.body.date).format("YYYY-MM-DD")
    : moment().format("YYYY-MM-DD");
  let expense = {
    item: req.body.item,
    amount: Number(req.body.amount),
    group: req.body.group,
    date: new Date(date),
  };
  let expenseDocument = new Expense(expense);
  try {
    expenseDocument.save();
    res.send(`Amount is ${expense.amount} in ${expense.group}`);
  } catch (error) {
    res.send(error);
  }
});

router.put("/update", function (req, res) {
  let groupBefore = req.query.group1;
  let groupAfter = req.query.group2;
  Expense.findOneAndUpdate({ group: groupBefore }, { group: groupAfter }).then(
    (expense) => {
      res.send(`${expense.item} has successfully changes to ${groupAfter}.`);
    }
  );
});

router.get("/expenses/:group", function (req, res) {
  let wantedGroup = req.params.group;
  let total = req.query.total;
  if (total == "true") {
    Expense.aggregate([
      { $match: { group: wantedGroup } },
      {
        $group: {
          _id: "$group",
          totalAmount: { $sum: "$amount" },
        },
      },
    ]).then((AmountInGroup) => {
      res.send(AmountInGroup);
    });
  } else {
    Expense.find({ group: wantedGroup }).then((expensesInSameGroup) => {
      res.send(expensesInSameGroup);
    });
  }
});

module.exports = router;
