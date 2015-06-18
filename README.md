# echo-nest
echo conf files and AWS lambda file for communication to nest via echo-nest-ws

#Set Up
This project is meant to be used in conjunction with echo-nest-ws.  These are the required files to set up an App on Amazon Echo SDK and configured to run with the echo-nest-ws.

#Info
/conf directory contains the Intent JSON as well as the mutterance text file.  There are also some sample intent files that can be used to test the AWS lambda endpoint.

/src directory contains the nest.json file to provide to AWS lambda.  Instructions for setting up a lambda endpoint and pointing it to your Echo app are provided in the Echo SDK documentation.

