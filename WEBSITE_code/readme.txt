LOGIN
heroku git:remote -a air-quality-monitor

cd /Users/YOUR PATH/air_quality_monitor
if not working then type 
heroku authorizations:create
change your .netrc
git push heroku master

heroku logs --tail --app air-quality-monitor

heroku restart --app air-quality-monitor

git push heroku master

heroku config:set MONGODB_URI="MONGO DB URL" --app air-quality-monitor


git add .
git commit -m "Update"
git push heroku master
heroku restart --app air-quality-monitor

heroku ps:scale web=1 --app air-quality-monitor
heroku ps:scale web=0 --app air-quality-monitor


