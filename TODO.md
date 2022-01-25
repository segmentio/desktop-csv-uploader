* Refactoring
1. right now it passes around the whole file in memory, need to limit that to the Head of the file
2. Improve error handling?
3. conditionally load field selector depending on event types

* Features
1. remove entire columns from particular calls?
2. arbitrary (cell) transformations with the text editor
3. ignore rows conditionally (i.e. ignore row is column x == y )
4. gives report on how many events were actually sent in
5. copy settings from history
6. validation via protocols

* Suggestions
1. instructions for setting up a source(something like tooltip)
2. protocols
3. external ids fields? (maybe a transformation)
4. more api methods
5. Are context events important?
6. The csv file may not be in a row by row event format
7. might not have a column for event name (or any other required fields)
      default event name?
      Segment standard spec validation?
      determine most common historical upload sources
