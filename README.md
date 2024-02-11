
## How to get it running..

You can run it locally via node (and maybe PM2) or via Docker:

```bash
  git clone https://github.com/MrSleeps/FrigateTimelapser.git
  cd FrigateTimelapser
  ./build
```
Once it's built (hopefully without errors), copy the docker-compose file below and make the relevant changes


```bash
version: '3.6'

services:
  flame:
    image: mrsleeps/frigate-timelapse
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

It's very much written for my needs and as such will have bugs (and zero error checking), suggestions/problems in "Issues" here on Github
