# Steps to Deploy to Heroku with a Postgres Database

Step 1: create a new app on Heroku
* Either in the command line or in at heroku.com, create a new app
* Connect it to your github repo
* Enable automatic deployment

Step 2: Go to the ‘resources’ tab

Step 3: search for heroku postgres
* get the free version

Step 4: go to the settings tab
* Click on the ‘reveal config vars’
* You should see a config variable called DATABASE_URL with some postgres url that heroku is giving you

Step 5: connect your schema
* In your terminal, connect your schema to your heroku app by doing the following:
* Navigate to where your schema file lives
* Type in the following command:

## heroku pg:psql -f schema.sql -a heroku_app_name

That's it! Enjoy your Heroku app with a database.
