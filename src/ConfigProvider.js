export default {

  isFirstStartup: function() {
    
  },

  getRootClasswarePath: function() {
    var defaultPath = "."
    return defaultPath
  },

  /*
   * Returns a Json object with row and column size. E.g. {row: 2, column: 2}
   */
  getLayout: function() {
    return {row: 2, column: 2}
  },

}