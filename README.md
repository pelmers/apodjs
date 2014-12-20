apodjs
------
Find and download APODs from NASA.

Install: `npm install -g apodjs`

### Examples:
Set your wallpaper to today's picture on boot, using Nitrogen with Openbox:
`~/.config/openbox/autostart`
```
apodjs --download | xargs nitrogen --set-zoom-fill &
```

#### Usage
```
apodjs is a tool to find and download NASA's astronomy picture of the day.
With no arguments, the program will print the URL to today's picture.
Options:
  --type         Find either random image or for a specific day Default: random. Valid: random,today
  --date         Date in the format "YYMMDD". Under random, defines earliest possible date. Under today, defines date to get. Default: 141219. Matches: /\d{6}/
  --download     Download the image we find to cwd and print the resulting path.
  --description  Print the picture explanation.
```
