const Cart = require("../model/cartModel");
const Product = require("../model/productModel");
const Order = require("../model/order");
const Coupon = require("../model/couponModel");

module.exports = {
  findCart: function (userId) {
    return new Promise((resolve, reject) => {
      Cart.findOne({ owner: userId }).then((cart) => {
        resolve(cart);
      });
    });
  },

  updateStock: function (items) {
    return new Promise((resolve, reject) => {
      items.forEach((item) => {
        let itemQuantity = item.quantity;
        Product.updateOne(
          { _id: item.itemId },
          { $inc: { stock: -itemQuantity } }
        )
          .then(() => {
            return;
          })
          .catch((err) => {});
      });
      resolve();
      reject(err);
    });
  },

  createOrder: function (order) {
    return new Promise((resolve, reject) => {
      let newOrder = new Order(order)
        .save()
        .then(() => {
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    });
  },

  couponUpdate: function (coupon, userId) {
    return new Promise((resolve, reject) => {
      Coupon.updateOne(
        { couponCode: coupon.couponCode },
        { $push: { users: userId } }
      )
        .then(() => {
          resolve();
        })
        .catch(() => {
          let error = new Error();
          reject(error);
        });
    });
  },
  deleteCart: function (userId) {
    return new Promise((resolve, reject) => {
      Cart.deleteOne({ owner: userId })
        .then(() => {
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
};
