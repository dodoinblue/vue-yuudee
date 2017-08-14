#!/bin/bash
echo "===== after prepare ====="
echo "applying icon"
cordova-icon --config=config.xml --icon=static/img/launcher_icon_1024.png
echo "applying splash"
cordova-splash --config=config.xml --splash=static/img/background.png