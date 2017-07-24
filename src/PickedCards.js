var pickedCards = []

export default {
  addCard: function(uuid) {
    console.log('adding: ' + uuid)
    pickedCards.push(uuid)
    console.log('pickedCards: ' + pickedCards)
  },
  removeCard: function(uuid) {
    console.log('removing: ' + uuid)
    _.remove(pickedCards, function(o){
      console.log(o)
      return o == uuid
    })
    console.log('pickedCards: ' + pickedCards)
  },
  clearList: function() {
    pickedCards = []
  },
  isInList: function(uuid) {
    console.log('!!!!retuning: ' + pickedCards.indexOf(uuid) > -1)
    return pickedCards.indexOf(uuid) > -1
  },
  getList: function() {
    return pickedCards
  },
  hasItem: function() {
    return pickedCards.length > 0
  }
}