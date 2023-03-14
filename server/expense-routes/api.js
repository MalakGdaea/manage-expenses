const express = require("express");
const mongoose = require("mongoose");
const moment = require("moment");
mongoose.connect("mongodb://localhost/expenseDB");
const Expense = require("../model/Expense");
const router = express.Router();

router.get("/expense", function (req, res) {
  let startDate = req.query.d1;
  let endDate = req.query.d2;
  let query = getQueryBasedOnDates(startDate, endDate);
  try {
    Expense.find(query)
      .sort({ date: -1 })
      .then((expensesSortedByDate) => {
        res.send(expensesSortedByDate);
      });
  } catch (error) {
    res.status(500).send(error);
  }
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
    res.staus(500).send(error);
  }
});

router.put("/expense", function (req, res) {
  let groupBefore = req.query.group1;
  let groupAfter = req.query.group2;
  try {
    Expense.findOneAndUpdate(
      { group: groupBefore },
      { group: groupAfter }
    ).then((expense) => {
      res.send(`${expense.item} has successfully changes to ${groupAfter}.`);
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get("/expense/:group", function (req, res) {
  let wantedGroup = req.params.group;
  let total = req.query.total;
  try {
    let query = getQueryBasedOnTotal(total, wantedGroup);
    Expense.aggregate(query).then((result) => {
      res.send(result);
    });
  } catch (error) {
    res.status(500).send(error);
  }
});

const getQueryBasedOnTotal = function (total, wantedGroup) {
  if (total == "true" || total == "True") {
    let query = [
      { $match: { group: wantedGroup } },
      {
        $group: {
          _id: "$group",
          totalAmount: { $sum: "$amount" },
        },
      },
    ];
    return query;
  }
  return [{ $match: { group: wantedGroup } }];
};

module.exports = router;
