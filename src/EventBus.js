import Vue from 'vue';
export const EventBus = new Vue();

export const Events = {
  DISPLAY_CATEGORY: 'CATEGORY_CLICKED',
  DISPLAY_CARD: 'CARD_CLICKED',

  DISPLAY_CARD_SETTINGS_OPEN: 'DISPLAY_CARD_SETTINGS_OPEN',
  DISPLAY_CARD_SETTINGS_CLOSE: 'DISPLAY_CARD_SETTINGS_CLOSE',

  DISPLAY_DRAWER_UPDATED: 'DISPLAY_DRAWER_UPDATED',

  // DISPLAY_CLASSWARE_SETTINGS_OPEN: 'DISPLAY_CLASSWARE_SETTINGS_OPEN',
  DISPLAY_CLASSWARE_SETTINGS_CLOSE: 'DISPLAY_CLASSWARE_SETTINGS_OPEN',

  DISPLAY_DRAWER_CLOSE: 'DISPLAY_DRAWER_CLOSE',
  DISPLAY_NEW_ROOT_CLASSWARE: 'DISPLAY_NEW_ROOT_CLASSWARE',
  DISPLAY_CATEGORY_DELETED: 'DISPLAY_CATEGORY_DELETED',
  DISPLAY_CURRENT_CATEGORY_DELETED: 'DISPLAY_CURRENT_CATEGORY_DELETED',

  // Resource page
  RESOURCE_NEW_CARD_CLOSE: 'RESOURCE_NEW_CARD_CLOSE',
  RESOURCE_CATEGORY: 'RESOURCE_CATEGORY',
  RESOURCE_DRAWER_CLOSE: 'RESOURCE_DRAWER_CLOSE',
  RESOURCE_NEW_CATEGORY_ADDED: "RESOURCE_NEW_CATEGORY_ADDED",
  RESOURCE_NEW_CARD_ADDED: "RESOURCE_NEW_CARD_ADDED",
  EDIT_RESOURCE_CATEGORY: "EDIT_RESOURCE_CATEGORY",
  EDIT_RESOURCE_CARD: "EDIT_RESOURCE_CARD",
  RESOURCE_ITEM_DELETED: "RESOURCE_ITEM_DELETED",
  RESOURCE_CARD_UPDATED: "RESOURCE_CARD_UPDATED",
  RESOURCE_BACK_PRESSED: "RESOURCE_BACK_PRESSED",

  // Add cards from resource
  ADD_CARDS_FROM_RESOURCE: "ADD_CARDS_FROM_RESOURCE"
}