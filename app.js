//jshint esversion:8

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');
const PORT = process.env.PORT || 3000;
require("dotenv").config();

const app = express();

app.set('view engine', 'ejs');
mongoose.set('strictQuery', true);

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

const connectDB = async () => {
  try {
    const conn = await mongoose.connect('mongodb+srv://'+process.env.ADMIN_NAME +':'+process.env.ADMIN_PASS+'@cluster0.duotza2.mongodb.net/todolistDB', {useNewUrlParser: true});
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to off a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", (req, res) => {

  Item.find({}, (err, foundItems) => {
    res.type('html').send(html);
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Succesfully saved default items to DB.");
        }
        res.redirect("/");
      });
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);
  if (customListName == "Favicon.ico") return;
  List.findOne({name: customListName}, (err, foundList) => {
    if (!err) {
      //existing list
      if (!foundList) {
        // create new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save((err, result) => {
          res.redirect("/" + customListName);
        });
      } else {
        //show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });
});

app.post("/", (req, res) => {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item ({
    name : itemName
  });

  if (listName === "Today") {
    item.save((err, result) => {
      res.redirect("/");
    });
  } else {
    List.findOne({name: listName}, (err, foundList) => {
      foundList.items.push(item);
      foundList.save((err, result) => {
        res.redirect("/" + listName);
      });
    });
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    List.findByIdAndRemove(checkedItemId, (err) => {
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) => {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
});


app.get("/about", (req, res) => {
  res.render("about");
});

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log("listening for requests");
    });
});
