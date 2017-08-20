var pickedCards = []

export default {
  addCard: function(uuid) {
    pickedCards.push(uuid)
  },
  removeCard: function(uuid) {
    _.remove(pickedCards, function(o){
      return o == uuid
    })
  },
  clearList: function() {
    pickedCards = []
  },
  isInList: function(uuid) {
    return pickedCards.indexOf(uuid) > -1
  },
  getList: function() {
    return pickedCards
  },
  hasItem: function() {
    return pickedCards.length > 0
  }
}