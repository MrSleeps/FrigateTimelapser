## Frigate Timelapser

This is a node app that helps generate timelapse videos from a Frigate feed. It takes a snapshot every few seconds and when called will create a timelapse of the last 15 seconds.

## Why did I write this?

Because at the time Frigate didn't have a timelapse function and I find the one that it currently has clunky and unreliable. I wanted something that I could easily call from Home Assistant and it generate a video when, for example, my front door opens.

It's very much a work in progress and has next to no error checking. It does however work, I've been using it for a about a year, sending videos to my telegram via Home Assistant.

## How to get it running..

You can run it locally via node (and maybe PM2) or via Docker.

## Running locally.

Clone the repo:

```plaintext
  git clone https://github.com/MrSleeps/FrigateTimelapser.git
  cd FrigateTimelapser
```

Run `npm install` and wait for it to finish, once it's done it's business you need to edit your frigate.env file (scroll down for more information). Once your timelapse.env file is created you start the Timelapser by either of the following commands:

```plaintext
npm start
```

or

```plaintext
node server.js
```

### Docker install

You can either build it yourself or grab it from DockerHub.

If you are building it yourself:

```plaintext
  git clone https://github.com/MrSleeps/FrigateTimelapser.git
  cd FrigateTimelapser
  ./build
```

Once it's built (hopefully without errors), or you are grabbing it direct from DockerHub, you need to copy the docker-compose file below and make the relevant changes

```plaintext
version: '3.6'

services:
  timelapser:
    image: mrsleeps/frigate-timelapser
    container_name: frigate-timelapser
    volumes:
      - ${PWD}/files:/app/files
      - ${PWD}/timelapse.env:/app/.env
    ports:
      - 8500:8500
    restart: unless-stopped
```

Before running you will need to do a few things, create a directory called files (or whatever) and update this line:

```plaintext
      - ${PWD}/files:/app/files
```

Replacing `${PWD}/files` with whatever directory you created.

Next you need to create your .env file. Create a file called timelapse.env and copy and paste the following (modifiy for your own setup):

```plaintext
# The URL of this docker (ex: https://frigate-timelapse.yourhost.tld)
# No / at the end please!
timelapseURL = "http://your.host"
timelapsePort = "8500"
```

Change `timelapseURL` to whatever url you will be using (if behind a proxy use the proxy address).

**If you change** `timelapsePort` **remember to update your docker-compose.yml file!**

Once that's all done, update the line in docker-compose.yml

```plaintext
      - ${PWD}/timelapse.env:/app/.env
```

with the location of your timelapse.env file.

Save

Then run

```plaintext
docker-compose up -d
```

If all goes to plan Frigate Timelapser will be up and running and listening at your.host:8500

When you first visit Frigate Timelapser it will run you through a few setup questions, you will need to enter the following:

**Frigate URL** - This is fairly self explanatory, enter in the format http://your.host.tld (**no trailing /**)

**Frigate Cameras** - Enter your cameras, seperate cameras by a comma. For example ```camera1,camera2,camera3```

If  you are using the Home Assistant post back doobrie you will need to fill out the following two fields:

**Home Assistant URL** - Again, self explanatory and **no trailing slashes**.

**Home Assistant Webhook ID** - You can find this in your Home Assistant, under automations->triggers->webhooks. It'll give you the ID and paste it here.

Click save and off you go!

If you don't trust a web interface to set it up and prefer to do it the old school way by editing a text file you can also do that. Fire up your trusty text editor, copy and paste in the following and edit it to suit your needs.

```
{
    "needsSetup": 0,
    "frigateURL": "https://your.frigate.host",
    "frigateCameras": "camera1,camera2,camera3",
    "hassURL": "https://your.hass.host",
    "hassWebhook": "",
    "usingHomeAssistant": 0,
    "timeLapseSeconds": 16,
    "keepImagesMinutes":60,
    "keepVideosDays":1
}
```

Edit docker-compose.yml and add the following line to the **volumes** section:

```
      - /path/to/the/config.json:/app/data/config.json
```

## Generating a timelapse

If you want to generate a timelapse you need to call (via a GET call) the url **/:camera/timelapse/:hass/:json** with the variables changed. What you set will generate different views.

Start with the variables..

**:camera** is the name of your camera, office for example  
**:hass** is if you are calling it from Home Assistant  
**:json** if you would like a json reply

The **:hass** option generates the video and then returns via POST to your Home Assistant URL that you set in the timelapse.env file. I use this to then send a copy of the timelapse on to my Telegram account  
The **:json** option decides if you want a json reply with the url of the timelapse or you actually want to view it on the website. **1** returns json and **2** returns a webpage with the video embeded.

So for example, to generate a timelapse manually from a camera called "frontdoor" and watch it via your phone you would visit http://your.host.tld:8500/frontdoor/timelapse/0/0

If you were calling it from Home Assistant and wanted to get a copy of the timelapse sent back to Home Assistant you would visit http://your.host.tld:8500/frontdoor/timelapse/1/0

And finally, if you wanted to return a json which you can use in some other webpage/script/whatever you'd call http://your.host.tld:8500/frontdoor/timelapse/0/1 which would return json like: `{"action":"finishedTimelapse","filename":"frontdoor/2024-02-12-02-55-06.mp4","camera":"frontdoor"}`

Generating the timelapse takes some time, it's not an instant thing. Obviously the faster the host system is the quicker it will be.

It's very much written for my needs and as such will have bugs (and very little error checking), suggestions/problems in "Issues" here on Github.