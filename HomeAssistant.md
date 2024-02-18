## Home Assistant setup

Setting up Frigate Timelapser to work with Home Assistant requires a bit of manual work, you need to delve in to the innards of home assistant.

First up, you'll need to add some [RESTful](https://www.home-assistant.io/integrations/rest_command/) commands. You will need one for each of your cameras. So crack out your favourite editor and add something that looks like the following to your Home Assistant config file…

```plaintext
rest_command:
  get_camera1_timelapse:
    url: "https://your.timelapse.host/camera1/timelapse/1/0"
    method: get
  get_camera2_timelapse:
    url: "https://your.timelapse.host/camera2/timelapse/1/0"
    method: get
  get_camera3_timelapse:
    url: "https://your.timelapse.host/camera3/timelapse/1/0"
    method: get    
```

Save the file and restart Home Assistant.

Once Home Assistant has restarted, click **Settings** (in the left menu), then **Automations & Scenes** and then click **Scripts**.

Create a new blank script and give it a name, something like “Request Frigate Timelapse video”?

Go to the script YAML editor (top right) and make your script look like something below:

```plaintext
alias: Generate Timelapse videos
sequence:
  - service: rest_command.get_camera1_timelapse
    data: {}
  - delay:
      hours: 0
      minutes: 0
      seconds: 5
      milliseconds: 0
  - service: rest_command.get_camera2_timelapse
    data: {}
  - delay:
      hours: 0
      minutes: 0
      seconds: 5
      milliseconds: 0
  - service: rest_command.get_camera3_timelapse
    data: {}
mode: single
icon: mdi:camera
```

You don't have to put the delay in, I just do it so it doesn't swamp the app and it also allows people to move on to the next camera.

Save your script.

Now head over to automations, create a new blank one.

For the trigger, select webhook (down the bottom of the dropdown). This gives you the all important webhook ID. Copy that and head over to your Frigate Timelapser install (in a new window) and click on the settings cog in the top right of the screen.

While on the Timelapser site, click the button under “Are you going to link this to Home Assistant?”, this brings up your Home Assistant options. Fill out your Home Assistant URL (no / at the end) and in the next box paste the webhook ID you got just now. Save and head back to your Home Assistant tab.

I'm going to show you how to send a message to Telegram (you might not use it but it will give you the basics - you can setup Telegram and Home Assistant by [visiting here](https://www.home-assistant.io/integrations/telegram_bot/) [or here](https://www.home-assistant.io/integrations/telegram_broadcast)). Under Actions on the add Automation page click Add Action and choose call service. Choose telegram\_bot.send\_video and then click the 3 dots on the action card, choose edit YAML.

My YAML looks like this

```plaintext
service: telegram_bot.send_video
data:
  data_template:
    url: "{{trigger.json.video}}"
```

The important part is `{{trigger.json.video}}`, this should contain the url to the video just created. So when the automation is triggered, it will then attach the video by embedding the link in the Telegram message.

My full automation YAML is:

```plaintext
alias: Send Timelapse videos to Telegram
description: ""
trigger:
  - platform: webhook
    webhook_id: "my_webhook_id"
    allowed_methods:
      - POST
      - PUT
    local_only: true
condition: []
action:
  - service: telegram_bot.send_video
    data_template:
      url: "{{trigger.json.video}}"
mode: parallel
```

How you set yours up is totally down to you!

Once you have done that you need to setup one final automation, this is what will call the script to get the Timelapse video, whatever triggers it is down to you but I have mine triggered when the Front Door opens and I'm not marked as home. My automation YAML is this:

```plaintext
alias: Send alert when front door opens
description: ""
trigger:
  - type: opened
    platform: device
    entity_id: binary_sensor.aqara_front_door_sensor_contact
    domain: binary_sensor
condition:
  - condition: state
    entity_id: person.mrlseeps
    state: not_home
    enabled: true
    for:
      hours: 0
      minutes: 1
      seconds: 0
action:
  - service: script.generate_timelapse_videos
    data: {}
mode: single
```

Again, however you set yours up (what triggers etc) is down to you!