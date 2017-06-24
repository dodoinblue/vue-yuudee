import Q from 'q'
import {EventBus} from './EventBus'

// var allCards = {};
var allCards = require('../static/card-assets/cards.json');

var setAllCards = function(allCardsJson) {

  // if (typeof cordova == 'undefined') {
  //   console.log("using preloaded cards.json");
  //   allCards = require('../static/card-assets/cards.json');
  // } else {
  //   allCards = allCardsJson;
  // }
  EventBus.$emit('ALL_CARDS_LOADED');
}

var getSubCardsList = function (wholeTree, subPath) {
  // Whole tree should be an object with 2 params: path & children
  // Children is an array.
  // If an element of children is a stack, then it is a object, containing its own path & children.
  // If an element of children is a card, then it is a string of the full path

  // First, if subPath equals to wholeTree's path, then we have found the subpath
  var result = null;
  if (wholeTree.path == subPath) {
    result = wholeTree.children;
  } else if (wholeTree.children) {
    // Then recursively search all children
    for (var i = 0;
          i < wholeTree.children.length && typeof wholeTree.children[i] === 'object';
          i++) {
      if (result) {
        return result;
      } else {
        result = getSubCardsList(wholeTree.children[i], subPath);
      }
    }
  }
  return result;
};

var getCardsByPath = function(subPath) {
  return getSubCardsList(allCards, subPath);
}

var get1stLevelStack = function (wholeTree) {
  var stacks = [];
  for (var i = 0; i < wholeTree.children.length; i++) {
    // Make sure only stack is added into the list
    if (wholeTree.children[i].children) {
      // Clone it so it won't modify original data
      var stack = clone(wholeTree.children[i]);
      // Don't need children list for the 1st level list
      delete stack.children;
      stacks.push(stack);
    }
  }
  return stacks;
};

var parseList = function (list) {
  var cards = [];
  for (var i = 0; i < list.length; i++) {

    var card = clone(list[i]);
    if (card.children) {
      delete card.children;
      card.isStack = true;
    }
    cards.push({data: card});
  }
  return cards;
};

function clone(obj) {
  if (null == obj || "object" != typeof obj) return obj;
  var copy = obj.constructor();
  for (var attr in obj) {
    if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
  }
  return copy;
}

export default {
  getCardsByPath,
  setAllCards
}