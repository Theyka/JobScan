TODO:
---
- Sepearete the code into different files
- Recreate backend to scrape data and store it in a database
- Create a telegram bot to send notifications about new jobs
- Add personal notification settings to the bot for each user
-Add admin panel with these features:
    - Login page for admin
        - I'm not going to implement reset password feature because I don't have smtp server and I don't want to rely on gmail etc (Hate to use gmail for this kind of things its not secure)
    - Export data to csv file:
        - Company name
        - Job title
        - Stack/Technologies used in the job
        - Source (Glorri or JobSearch)
        - Posted date
        - Deadline (if available)
        - Location (if available)
        - Employment type (Full-time, Part-time, etc)
        - Salary (if available)
        - Views count (ONLY IN OUR WEBSITE, NOT FROM THE SOURCE PLATFORMS)
    - Dashboard Analytics:
        - Website visits
        - From-To Calendar
        - Filter preset buttons:
            - Current month (default)
                - Sepeare bar for each day
            - Current Year
                - Sepeare bar for each month
        - Top 10 positions:
            - Top 10 positions by visit and interaction (clicks)
            - Top 10 companies by visit and interaction (clicks)
        For analytics we can use https://plausible.io/ its open source and we can self host it, so we don't need to rely on third party services for analytics, also it has a nice dashboard and it provides all the features we need for analytics. OR we can build our own analytics dashboard using the data we have in our database, but it will take more time and effort to build it from scratch, so I think using plausible is a better option for this project. (will consider this later)

Tech Stack:
---
- Python
- Tailwind CSS
- Supabase

Platforms to scrape:
---
- Glorri:
    - Urls:
        - https://jobs.glorri.az/?jobFunctions=science-technology-engineering
        - https://api.glorri.az/job-service-v2/jobs/public?jobFunctions%5B%5D=science-technology-engineering&offset=0&limit=20 
    
    - Limit can be 20 at max, so we need to make multiple requests to get all the data
    - Here is example job from the api response:
    ```
        {
      "title": "Middle Full Stack Developer",
      "slug": "starkidstories-middle-full-stack-developer-34407",
      "postedDate": "2026-01-26T06:33:59.541Z",
      "isRemote": false,
      "jobFunction": "Software, application development, web design",
      "careerLevel": "Professional",
      "location": "Bakı, Azərbaycan",
      "viewCount": 1673,
      "type": "Full-time",
      "isProAd": true,
      "company": {
        "slug": "starkidstories",
        "name": "Studio 8",
        "logo": "504f14ae-7219-4f53-9d16-4bed420f623a.png"
      }
    }
    ```
    After that we should build an url like this:
    https://jobs.glorri.com/vacancies/starkidstories/starkidstories-middle-full-stack-developer-34407
    so we can scrape the job data from it.

- JobSearch:
    - Urls:
        - https://jobsearch.az/api-az/vacancies-az?hl=az&q=&posted_date=&seniority=&categories=1076&industries=&ads=&location=&job_type=&salary=&order_by=

    - They only give json data if we have **X-Requested-With: XMLHttpRequest** header, otherwise they return html page, so we need to set this header in our requests.
    - Also in every json response there is "next" field which contains the url for the next page, so we should use this field to get all the data until it becomes null.



After we get all the data from both platforms, we should store it in a database we also should consider the fact that there might be duplicate jobs from both platforms, so we should check for duplicates before storing the data in the database. We cann't use the job title and company name as a unique identifier for each job because one company could have different name on different platforms, so we should add fingerprinting to the job descripition and use it as a unique identifier for each job. Also we should CLEAN the html from the job description and use MD file format to store the job description in the database, so we can easily display it on the frontend. We can use libraries like BeautifulSoup to clean the html and convert it to MD format. After that we should build a simple frontend to display the jobs in a nice way, we can use Tailwind CSS for styling and Supabase for the backend.

The problem is that, ALL OF THIS NEEDS A LOT OF TIME :)