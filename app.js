const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true });
// mongoose model
const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);  // model name - item

const item1 = new Item({
  name: "Welcome to your Todo List!"
});
const item2 = new Item({
  name: "Hit the + button to add an item"
});
const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3]; // array of items

const  listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


// home route instrucations
app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems) {    // if no item is
    if (foundItems.length === 0) {              // there then this instrucation
      Item.insertMany(defaultItems, function(err) {   // inserting data(items into database)
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved db");
        }
      });
      res.redirect("/"); // if not found items then
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});  // else post items from array
    }
  });
});

app.get("/:customListName", function(req, res){  // dynamic express route parameter
const customListName = _.capitalize(req.params.customListName);

List.findOne({name: customListName}, function(err, foundList){  // so that it should save lists only once if found
  if (!err){
    if (!foundList){ // create new list
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + customListName);
    } else {   // show an existing list
  res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
  }
});
});

app.post("/", function(req, res) {

const itemName = req.body.newItem;
const listName = req.body.list;
const item = new Item({
  name: itemName
});

if (listName === "Today"){
  item.save();
  res.redirect("/");
} else {
  List.findOne({name: listName}, function(err, foundList){
    foundList.items.push(item);
    foundList.save();
    res.redirect("/" + listName);
  });
}
});

app.post("/delete", function(req, res){
const checkedItemId = req.body.checkbox;
const listName = req.body.listName;

if (listName === "Today") {
  Item.findByIdAndRemove(checkedItemId, function(err){
    if (!err){
      console.log("successfully deleted"); // after doing any operation redirect to home page using res.redirect
      res.redirect("/");
    }
  });
} else {
  List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
    if (!err){
      res.redirect("/" + listName);
    }
  });
}
});



// app.get("/work", function(req, res) {
//   res.render("list", {
//     listTitle: "Work List",
//     newListItems: workItems
//   });
// });

app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
