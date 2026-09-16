# MySQL schema

The schema in `schema.sql` is designed for MySQL 8.0+. It normalizes the existing MongoDB collections into four tables: `users`, `videos`, `subscriptions`, and `watch_history`.

To create it on a MySQL server:

```powershell
mysql -u root -p < mysql/schema.sql
```

The resulting database is named `streamline`. To connect the Node backend after its database layer is migrated, use these values in `.env`:

```env
MYSQL_HOST=127.0.0.1:3306
MYSQL_PORT=3306
MYSQL_DATABASE=streamline
MYSQL_USER=root
MYSQL_PASSWORD=1234
```

This creates only the database schema. The current Node backend still uses Mongoose/MongoDB; switching it to MySQL requires replacing the Mongoose models and MongoDB query code with a MySQL client or ORM.
