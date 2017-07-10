import Vue from 'vue';
export const EventBus = new Vue();

export const Events = {
  DISPLAY_CATEGORY: 'CATEGORY_CLICKED',
  DISPLAY_CARD: 'CARD_CLICKED',

  DISPLAY_CARD_SETTINGS_OPEN: 'DISPLAY_CARD_SETTINGS_OPEN',
  DISPLAY_CARD_SETTINGS_CLOSE: 'DISPLAY_CARD_SETTINGS_CLOSE',

  DISPLAY_CLASSWARE_SETTINGS_OPEN: 'DISPLAY_CLASSWARE_SETTINGS_OPEN',
  DISPLAY_CLASSWARE_SETTINGS_CLOSE: 'DISPLAY_CLASSWARE_SETTINGS_OPEN',

  DISPLAY_DRAWER_CLOSE: 'DISPLAY_DRAWER_CLOSE'
}