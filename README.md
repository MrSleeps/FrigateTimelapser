# Frigate Timelapser

This is a node app that helps generate timelapse videos from a Frigate feed. It takes a snapshot every few seconds and when called will create a timelapse of the last 15 seconds. 

## Why did I write this? 

Because at the time Frigate didn't have a timelapse function and I find the one that it currently has clunky and unreliable.  I wanted something that I could easily call from Home Assistant and it generate a video when, for example, my front door opens.

It's very much a work in progress and has next to no error checking. It does however work, I've been using it for a about a year, sending videos to my telegram via Home Assistant.


## How to get it running..

You can run it locally via node (and maybe PM2) or via Docker:

You can either build it yourself or grab it from DockerHub.

If you are building it yourself:

```bash
  git clone https://github.com/MrSleeps/FrigateTimelapser.git
  cd FrigateTimelapser
  ./build
```
Once it's built (hopefully without errors), or you are grabbing it direct from DockerHub, you need to copy the docker-compose file below and make the relevant changes


```bash
version: '3.6'

services:
  flame:
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

```bash
      - ${PWD}/files:/app/files
```

Replacing ```${PWD}/files``` with whatever directory you created.

Next you need to create your .env file. Create a file called timelapse.env and copy and paste the following (modifiy for your own setup):

```bash
# The URL of this docker (ex: https://frigate-timelapse.yourhost.tld:port)
# No / at the end please!
timelapseURL = "http://your.host:8500"
# Comma seperated list of your cameras, no spaces please!
cameras = "camera1,camera2,camera3"
# The URL of your frigate install
frigateBaseURL = "https://your.frigate.url"
setLapseSeconds = 30
# The URL of your Home Assistant
homeAssistantURL = "https://your.homeassistant.url"
# Your Home Assistant API Token
homeAssistantToken = "Your Home Asssitant API Token"
postToHomeAssistant = 1;
```

Change ```timelapseURL``` to whatever url you will be using (if behind a proxy use the proxy address).

Modify ```cameras``` by creating a comma seperated list of your cameras that you want the Timelapser to access, these cannot (currently) have spaces in the names and must match the name that Frigate knows them as.

Change ```frigateBaseURL``` to whatever url your Frigate setup uses.

If you plan to use Home Assistant to grab the timelapses you will need to add your Home Assistant url to ```homeAssistantURL```.  Then you need to set up a webhook and paste the last bit in to ```homeAssistantToken``` (the bit after /webhook/). I'll post some examples of how mine works with Home Assistant at a later date.

Once that's all done, update the line in docker-compose.yml 

```
      - ${PWD}/timelapse.env:/app/.env
```
with the location of your timelapse.env file.

Save

Then run

```
docker-compose up -d
```

If all goes to plan Frigate Timelapser will be up and running and listening at your.host:8500

## Generating a timelapse

If you want to generate a timelapse you need to call (via a GET call) the url /:camera/timelapse/:hass/:json with the variables changed. What you set will generate different views.

Start with the variables..

**:camera** is the name of your camera, office for example
**:hass** is if you are calling it from Home Assistant 
**:json** if you would like a json reply

The **:hass** option generates the video and then returns via POST to your Home Assistant URL that you set in the timelapse.env file. I use this to then send a copy of the timelapse on to my Telegram account
The **:json** option decides if you want a json reply with the url of the timelapse or you actually want to view it on the website. **1** returns json and **2** returns a webpage with the video embeded.

So for example, to generate a timelapse manually from a camera called "frontdoor" and watch it via your phone you would visit http://your.host.tld:8500/frontdoor/timelapse/0/0

If you were calling it from Home Assistant and wanted to get a copy of the timelapse sent back to Home Assistant you would visit http://your.host.tld:8500/frontdoor/timelapse/1/0

And finally, if you wanted to return a json which you can use in some other webpage/script/whatever you'd call http://your.host.tld:8500/frontdoor/timelapse/0/1 which would return json like: ```{"action":"finishedTimelapse","filename":"frontdoor/2024-02-12-02-55-06.mp4","camera":"frontdoor"}``` 

Generating the timelapse takes some time, it's not an instant thing. Obviously the fast the host system is the quicker it will be.

It's very much written for my needs and as such will have bugs (and zero error checking), suggestions/problems in "Issues" here on Github.
