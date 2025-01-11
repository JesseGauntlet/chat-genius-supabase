Chat-genius v2

AI first attempt at a chat app.

Now using a supabase realtime backend and database.
Avoiding web socket complexity for now

Lessons:
-Add important file paths to .cursorrules to prevent cursor from forgetting and rewriting a whole new file in a new location
-Filestructure is important, perhaps have a structure drawn out fully. Had a basic one only.
- o1 is pretty good at logically following dataflow to debug

TODO:
-Tests and modularity going forward. Very easy to have AI delete one line while adding 80 so you don’t read it carefully, and that one line has a higher chance to break something the larger a file gets
-Threaded replies, search, indicators
-Deployment
-AI Features

*
-Could have thought through database structure even more
— Issues with private messages, how to best structure compared to public channels