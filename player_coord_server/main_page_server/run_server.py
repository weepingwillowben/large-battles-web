#!/usr/bin/env python

from minhttp import public_main as main

if __name__ == '__main__':
    main.app.run(port=8803,host="0.0.0.0",debug=False)
