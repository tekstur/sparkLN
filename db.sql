create database sparkln;
use sparkln;
create table spark_invoices(
	id varchar(36),
	datecreated DATETIME,
	value int(11),
	expiry int(11),
	memo varchar(255),
	account varchar(36),
	r_hash varchar(64)
);
