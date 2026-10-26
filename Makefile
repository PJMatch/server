.PHONY: dev-db stop-db clean-db run test client

dev-db:
	$(MAKE) -C server dev-db

stop-db:
	$(MAKE) -C server stop-db

clean-db:
	$(MAKE) -C server clean-db

run:
	$(MAKE) -C server run

test:
	$(MAKE) -C server test

client:
	cd client && npm run dev
