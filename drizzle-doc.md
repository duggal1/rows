Drizzle schema
Drizzle lets you define a schema in TypeScript with various models and properties supported by the underlying database. When you define your schema, it serves as the source of truth for future modifications in queries (using Drizzle-ORM) and migrations (using Drizzle-Kit).

If you are using Drizzle-Kit for the migration process, make sure to export all the models defined in your schema files so that Drizzle-Kit can import them and use them in the migration diff process.

import { integer, pgTable, varchar } from "drizzle-orm/pg-core";
export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar().notNull(),
  age: integer().notNull(),
  email: varchar().notNull().unique(),
});

Organize your schema files
You can declare your SQL schema directly in TypeScript either in a single schema.ts file, or you can spread them around — whichever you prefer, all the freedom!

Schema in 1 file
The most common way to declare your schema with Drizzle is to put all your tables into one schema.ts file.

Note: You can name your schema file whatever you like. For example, it could be models.ts, or something else.

This approach works well if you don’t have too many table models defined, or if you’re okay with keeping them all in one file

Example:

📦 <project root>
 └ 📂 src
    └ 📂 db
       └ 📜 schema.ts

In the drizzle.config.ts file, you need to specify the path to your schema file. With this configuration, Drizzle will read from the schema.ts file and use this information during the migration generation process. For more information about the drizzle.config.ts file and migrations with Drizzle, please check: link

import { defineConfig } from "drizzle-kit";
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts'
})

Schema in multiple files
You can place your Drizzle models — such as tables, enums, sequences, etc. — not only in one file but in any file you prefer. The only thing you must ensure is that you export all the models from those files so that the Drizzle kit can import them and use them in migrations.

One use case would be to separate each table into its own file.

📦 <project root>
 └ 📂 src
    └ 📂 db
       └ 📂 schema
          ├ 📜 users.ts
          ├ 📜 countries.ts
          ├ 📜 cities.ts
          ├ 📜 products.ts
          ├ 📜 clients.ts
          └ 📜 etc.ts

In the drizzle.config.ts file, you need to specify the path to your schema folder. With this configuration, Drizzle will read from the schema folder and find all the files recursively and get all the drizzle tables from there. For more information about the drizzle.config.ts file and migrations with Drizzle, please check: link

import { defineConfig } from "drizzle-kit";
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema'
})

You can also group them in any way you like, such as creating groups for user-related tables, messaging-related tables, product-related tables, etc.

📦 <project root>
 └ 📂 src
    └ 📂 db
       └ 📂 schema
          ├ 📜 users.ts
          ├ 📜 messaging.ts
          └ 📜 products.ts

Shape your data schema
Drizzle schema consists of several model types from database you are using. With drizzle you can specify:

Tables with columns, constraints, etc.
Schemas
Enums
Sequences
Views
Materialized Views
etc.
Let’s go one by one and check how the schema should be defined with drizzle

Tables and columns declaration
A table in Drizzle should be defined with at least 1 column, the same as it should be done in database. There is one important thing to know, there is no such thing as a common table object in drizzle. You need to choose a dialect you are using, PostgreSQL, MySQL, SQLite, etc.



import { pgTable, integer } from "drizzle-orm/pg-core"
export const users = pgTable('users', {
  id: integer()
});

By default, Drizzle will use the TypeScript key names for columns in database queries. Therefore, the schema and query from the example will generate the SQL query shown below

This example uses a db object, whose initialization is not covered in this part of the documentation. To learn how to connect to the database, please refer to the Connections Docs


TypeScript key = database key

// schema.ts
import { integer, pgTable, varchar } from "drizzle-orm/pg-core";
export const users = pgTable('users', {
  id: integer(),
  first_name: varchar()
})

// query.ts
await db.select().from(users);

SELECT "id", "first_name" from users;

If you want to use different names in your TypeScript code and in the database, you can use column aliases

// schema.ts
import { integer, pgTable, varchar } from "drizzle-orm/pg-core";
export const users = pgTable('users', {
  id: integer(),
  firstName: varchar('first_name')
})

// query.ts
await db.select().from(users);

SELECT "id", "first_name" from users;

Camel and Snake casing
Database model names often use snake_case conventions, while in TypeScript, it is common to use camelCase for naming models. This can lead to a lot of alias definitions in the schema. To address this, Drizzle provides a way to automatically map camelCase from TypeScript to snake_case in the database via a dedicated builder.

Use the snakeCase or camelCase builder from drizzle-orm/pg-core to declare a table whose column keys are automatically mapped to the chosen database naming convention

// schema.ts
import { snakeCase, camelCase } from 'drizzle-orm/pg-core';
export const users = snakeCase.table('users', {
  id: serial().primaryKey(),
  fullName: text(),        // → full_name in DB
  createdAt: timestamp(),  // → created_at in DB
});
// Available on all entity types:
snakeCase.table / snakeCase.view / snakeCase.materializedView / snakeCase.schema
camelCase.table / camelCase.view / camelCase.materializedView / camelCase.schema

// db.ts
import { drizzle } from "drizzle-orm/node-postgres";
const db = drizzle({ connection: process.env.DATABASE_URL })

// query.ts
await db.select().from(users);

select "id", "full_name", "created_at" from "users"

Advanced
There are a few tricks you can use with Drizzle ORM. As long as Drizzle is entirely in TypeScript files, you can essentially do anything you would in a simple TypeScript project with your code.

One common feature is to separate columns into different places and then reuse them. For example, consider the updated_at, created_at, and deleted_at columns. Many tables/models may need these three fields to track and analyze the creation, deletion, and updates of entities in a system

We can define those columns in a separate file and then import and spread them across all the table objects you have

// columns.helpers.ts
export const timestamps = {
  updated_at: timestamp(),
  created_at: timestamp().defaultNow().notNull(),
  deleted_at: timestamp(),
}

// users.sql.ts
export const users = pgTable('users', {
  id: integer(),
  ...timestamps
})

// posts.sql.ts
export const posts = pgTable('posts', {
  id: integer(),
  ...timestamps
})

Schemas

In PostgreSQL, there is an entity called a schema (which we believe should be called folders). This creates a structure in PostgreSQL:



You can manage your PostgreSQL schemas with pgSchema and place any other models inside it.

Define the schema you want to manage using Drizzle

import { pgSchema } from "drizzle-orm/pg-core"
export const customSchema = pgSchema('custom');

Then place the table inside the schema object

import { integer, pgSchema } from "drizzle-orm/pg-core";
export const customSchema = pgSchema('custom');
export const users = customSchema.table('users', {
  id: integer()
})

Example
Once you know the basics, let’s define a schema example for a real project to get a better view and understanding

All examples will use generateUniqueString. The implementation for it will be provided after all the schema examples

import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { pgEnum, pgTable as table } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
export const rolesEnum = pgEnum("roles", ["guest", "user", "admin"]);
export const users = table(
  "users",
  {
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    firstName: t.varchar("first_name", { length: 256 }),
    lastName: t.varchar("last_name", { length: 256 }),
    email: t.varchar().notNull(),
    invitee: t.integer().references((): AnyPgColumn => users.id),
    role: rolesEnum().default("guest"),
  },
  (table) => [
    t.uniqueIndex("email_idx").on(table.email)
  ]
);
export const posts = table(
  "posts",
  {
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    slug: t.varchar().$default(() => generateUniqueString(16)),
    title: t.varchar({ length: 256 }),
    ownerId: t.integer("owner_id").references(() => users.id),
  },
  (table) => [
    t.uniqueIndex("slug_idx").on(table.slug),
    t.index("title_idx").on(table.title),
  ]
);
export const comments = table("comments", {
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  text: t.varchar({ length: 256 }),
  postId: t.integer("post_id").references(() => posts.id),
  ownerId: t.integer("owner_id").references(() => users.id),
});

generateUniqueString implementation:

function generateUniqueString(length: number = 12): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let uniqueString = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    uniqueString += characters[randomIndex];
  }
  return uniqueString;
}

Drizzle relations
bun add drizzle-orm@rc
bun add drizzle-kit@rc -D


This guide assumes familiarity with:
Relations Fundamentals - get familiar with the concepts of foreign key constraints, soft relations, database normalization, etc - read here
Declare schema - get familiar with how to define drizzle schemas - read here
Database connection - get familiar with how to connect to database using drizzle - read here
The sole purpose of Drizzle relations is to let you query your relational data in the most simple and concise way:

import { drizzle } from 'drizzle-orm/...';
import { defineRelations } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';
export const users = p.pgTable('users', {
	id: p.integer().primaryKey(),
	name: p.text().notNull()
});
export const posts = p.pgTable('posts', {
	id: p.integer().primaryKey(),
	content: p.text().notNull(),
	ownerId: p.integer('owner_id'),
});
const relations = defineRelations({ users, posts }, (r) => ({
	posts: {
		author: r.one.users({
			from: r.posts.ownerId,
			to: r.users.id,
		}),
	}
}))
const db = drizzle({ client, relations });
const result = await db.query.posts.findMany({
  with: {
    author: true,
  },
});

[{
  id: 10,
  content: "My first post!",
  ownerId: 14,
  author: {
    id: 1,
    name: "Alex"
  }
}]

one()
Here is a list of all fields available for .one() in drizzle relations

const relations = defineRelations({ users, posts }, (r) => ({
	posts: {
		author: r.one.users({
			from: r.posts.ownerId,
			to: r.users.id,
			optional: false,
      alias: 'custom_name',
			where: {
				verified: true,
			}
		}),
	}
}))

author key is a custom key that appears in the posts object when using Drizzle relational queries.
r.one.users defines that author will be a single object from the users table rather than an array of objects.
from: r.posts.ownerId specifies the table from which we are establishing a soft relation. In this case, the relation starts from the ownerId column in the posts table.
to: r.users.id specifies the table to which we are establishing a soft relation. In this case, the relation points to the id column in the users table.
optional: false at the type level makes the author key in the posts object required. This should be used when you are certain that this specific entity will always exist.
alias is used to add a specific alias to relationships between tables. If you have multiple identical relationships between two tables, you should differentiate them using alias
where condition can be used for polymorphic relations. It fetches relations based on a where statement. For example, in the case above, only verified authors will be retrieved. Learn more about polymorphic relations here.
many()
Here is a list of all fields available for .many() in drizzle relations

const relations = defineRelations({ users, posts }, (r) => ({
	users: {
		feed: r.many.posts({
			from: r.users.id,
			to: r.posts.ownerId,
			alias: 'custom_name',
			where: {
				approved: true,
			}
		}),
	}
}))

feed key is a custom key that appears in the users object when using Drizzle relational queries.
r.many.posts defines that feed will be an array of objects from the posts table rather than just an object
from: r.users.id specifies the table from which we are establishing a soft relation. In this case, the relation starts from the id column in the users table.
to: r.posts.ownerId specifies the table to which we are establishing a soft relation. In this case, the relation points to the ownerId column in the posts table.
alias is used to add a specific alias to relationships between tables. If you have multiple identical relationships between two tables, you should differentiate them using alias
where condition can be used for polymorphic relations. It fetches relations based on a where statement. For example, in the case above, only approved posts will be retrieved. Learn more about polymorphic relations here.
One-to-one
Drizzle ORM provides you an API to define one-to-one relations between tables with the defineRelations function.

An example of a one-to-one relation between users and users, where a user can invite another (this example uses a self reference):

import { pgTable, text, integer } from 'drizzle-orm/pg-core';
import { defineRelations } from 'drizzle-orm';
export const users = pgTable('users', {
	id: integer().primaryKey(),
	name: text(),
	invitedBy: integer('invited_by'),
});
export const relations = defineRelations({ users }, (r) => ({
	users: {
		invitee: r.one.users({
			from: r.users.invitedBy,
			to: r.users.id,
		})
	}
}));

Another example would be a user having a profile information stored in separate table. In this case, because the foreign key is stored in the “profile_info” table, the user relation have neither fields or references. This tells Typescript that user.profileInfo is nullable:

import { pgTable, serial, text, integer, jsonb } from 'drizzle-orm/pg-core';
import { defineRelations } from 'drizzle-orm';
export const users = pgTable('users', {
	id: integer().primaryKey(),
	name: text(),
});
export const profileInfo = pgTable('profile_info', {
	id: serial().primaryKey(),
	userId: integer('user_id').references(() => users.id),
	metadata: jsonb(),
});
export const relations = defineRelations({ users, profileInfo }, (r) => ({
	users: {
		profileInfo: r.one.profileInfo({
			from: r.users.id,
			to: r.profileInfo.userId,
		})
	}
}));
const user = await db.query.users.findFirst({ with: { profileInfo: true } });
//____^? type { id: number, name: string | null, profileInfo: { ... } | null  }

One-to-many
Drizzle ORM provides you an API to define one-to-many relations between tables with defineRelations function.

Example of one-to-many relation between users and posts they’ve written:

import { pgTable, text, integer } from 'drizzle-orm/pg-core';
import { defineRelations } from 'drizzle-orm';
export const users = pgTable('users', {
	id: integer('id').primaryKey(),
	name: text('name'),
});
export const posts = pgTable('posts', {
	id: integer('id').primaryKey(),
	content: text('content'),
	authorId: integer('author_id'),
});
export const relations = defineRelations({ users, posts }, (r) => ({
  posts: {
    author: r.one.users({
      from: r.posts.authorId,
      to: r.users.id,
    }),
  },
  users: {
    posts: r.many.posts(),
  },
}));

Now lets add comments to the posts:

...
export const posts = pgTable('posts', {
	id: integer('id').primaryKey(),
	content: text('content'),
	authorId: integer('author_id'),
});
export const comments = pgTable("comments", {
  id: integer().primaryKey(),
  text: text(),
  authorId: integer("author_id"),
  postId: integer("post_id"),
});
export const relations = defineRelations({ users, posts, comments }, (r) => ({
  posts: {
    author: r.one.users({
      from: r.posts.authorId,
      to: r.users.id,
    }),
    comments: r.many.comments(),
  },
  users: {
    posts: r.many.posts(),
  },
  comments: {
    post: r.one.posts({
      from: r.comments.postId,
      to: r.posts.id,
    }),
  },
}));

Many-to-many
Drizzle ORM provides you an API to define many-to-many relations between tables through so called junction or join tables, they have to be explicitly defined and store associations between related tables.

Example of many-to-many relation between users and groups we are using through to bypass junction table selection and directly select many groups for each user.

import { defineRelations } from 'drizzle-orm';
import { integer, pgTable, primaryKey, text } from 'drizzle-orm/pg-core';
export const users = pgTable('users', {
  id: integer().primaryKey(),
  name: text(),
});
export const groups = pgTable('groups', {
  id: integer().primaryKey(),
  name: text(),
});
export const usersToGroups = pgTable(
  'users_to_groups',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    groupId: integer('group_id')
      .notNull()
      .references(() => groups.id),
  },
  (t) => [primaryKey({ columns: [t.userId, t.groupId] })],
);
export const relations = defineRelations({ users, groups, usersToGroups },
  (r) => ({
    users: {
      groups: r.many.groups({
        from: r.users.id.through(r.usersToGroups.userId),
        to: r.groups.id.through(r.usersToGroups.groupId),
      }),
    },
    groups: {
      participants: r.many.users(),
    },
  })
);

Query example:

const res = await db.query.users.findMany({
  with: { 
    groups: true 
  },
});
// response type
type Response = {
  id: number;
  name: string | null;
  groups: {
    id: number;
    name: string | null;
  }[];
}[];

Predefined filters
Predefined where statements in Drizzle’s relation definitions are a type of polymorphic relations implementation, but it’s not fully it. Essentially, they allow you to connect tables not only by selecting specific columns but also through custom where statements. Let’s look at some examples:

We can define a relation between groups and users so that when querying group’s users, we only retrieve those whose verified column is set to true

import { defineRelations } from "drizzle-orm";
import * as schema from './schema';
export const relations = defineRelations(schema,(r) => ({
    groups: {
      verifiedUsers: r.many.users({
        from: r.groups.id.through(r.usersToGroups.groupId),
        to: r.users.id.through(r.usersToGroups.userId),
        where: {
          verified: true,
        },
      }),
    },
  })
);
...
await db.query.groups.findMany({
    with: {
      verifiedUsers: true,
    },
});

IMPORTANT
You can only specify filters on the target (to) table. So in this example, the where clause will only include columns from the users table since we are establishing a relation TO users

export const relations = defineRelations(schema,(r) => ({
    groups: {
      verifiedUsers: r.many.users({
        from: r.groups.id.through(r.usersToGroups.groupId),
        to: r.users.id.through(r.usersToGroups.userId),
        where: {
          verified: true,
        },
      }),
    },
  })
);

Relations Parts
In a case you need to separate relations config into several parts you can use defineRelationsPart helpers

import { defineRelations, defineRelationsPart } from 'drizzle-orm';
import * as schema from "./schema";
export const relations = defineRelations(schema, (r) => ({
  users: {
    invitee: r.one.users({
      from: r.users.invitedBy,
      to: r.users.id,
    }),
    posts: r.many.posts(),
  }
}));
export const part = defineRelationsPart(schema, (r) => ({
  posts: {
    author: r.one.users({
      from: r.posts.authorId,
      to: r.users.id,
    }),
  }
}));

and then you can provide it to the db instance

const db = drizzle(process.env.DB_URL, { relations: { ...relations, ...part } })

IMPORTANT
There are a few rules you would need to follow to make sure it defineRelationsParts works as expected

Rule 1: If you specify reltions with parts, when passing it to drizzle db function you would need to specify it in the right order(main relations goes first)

// ✅
const db = drizzle(process.env.DB_URL, { relations: { ...relations, ...part } })
// ❌
const db = drizzle(process.env.DB_URL, { relations: { ...part, ...relations } })

Why it's important?

Rule 2: You should have min relations, so drizzle can infer all of the table for autocomplete. If you want to have only parts, then one of your parts should be empty, like this:

export const mainPart = defineRelationsPart(schema);

In this case, all tables will be inferred correctly, and you’ll have complete information about your schema

Performance
When working with relations in Drizzle ORM, especially in applications with significant data or complex queries, optimizing database performance is crucial.
Indexes play a vital role in speeding up data retrieval, particularly when querying related data. This section outlines recommended indexing strategies for each type of relationship defined using Drizzle ORM.

One-to-one Relationships
In a one-to-one relationship, like the “user invites user” example or the “user has profile info” example, the key performance consideration is efficient joining of the related tables.

For optimal performance in one-to-one relationships, you should create an index on the foreign key column in the table that is being referenced (the “target” table in the relation).

Why it is important

Example:

import * as p from 'drizzle-orm/pg-core';
import { defineRelations } from 'drizzle-orm';
export const users = p.pgTable('users', {
	id: p.integer().primaryKey(),
	name: p.text(),
});
export const profileInfo = p.pgTable('profile_info', {
	id: p.integer().primaryKey(),
	userId: p.integer('user_id').references(() => users.id),
	metadata: p.jsonb(),
});
export const relations = defineRelations({ users, profileInfo }, (r) => ({
	users: {
		profileInfo: r.one.profileInfo({
			from: r.users.id,
			to: r.profileInfo.userId,
		})
	}
}));

To optimize queries fetching user data along with their profile information, you should create an index on the userId column in the profile_info table.

import * as p from 'drizzle-orm/pg-core';
import { defineRelations } from 'drizzle-orm';
export const users = p.pgTable('users', {
	id: p.integer().primaryKey(),
	name: p.text(),
});
export const profileInfo = p.pgTable('profile_info', {
	id: p.integer().primaryKey(),
	userId: p.integer('user_id').references(() => users.id),
	metadata: p.jsonb(),
}, (table) => [
  p.index('profile_info_user_id_idx').on(table.userId)
]);
export const relations = defineRelations({ users, profileInfo }, (r) => ({
	users: {
		profileInfo: r.one.profileInfo({
			from: r.users.id,
			to: r.profileInfo.userId,
		})
	}
}));

CREATE INDEX "profile_info_user_id_idx" ON "profile_info" ("user_id");

One-to-many Relationships
Similar to one-to-one relationships, one-to-many relations benefit significantly from indexing to optimize join operations. Consider the “users and posts” example where one user can have many posts.

For one-to-many relationships, create an index on the foreign key column in the table that represents the “many” side of the relationship (the table with the foreign key referencing the “one” side).

Why it is important

Example:

import * as p from "drizzle-orm/pg-core";
import { defineRelations } from 'drizzle-orm';
export const users = p.pgTable('users', {
	id: p.integer().primaryKey(),
	name: p.text(),
});
export const posts = p.pgTable('posts', {
	id: p.integer().primaryKey(),
	content: p.text(),
	authorId: p.integer('author_id'),
});
export const relations = defineRelations({ users, posts }, (r) => ({
  posts: {
    author: r.one.users({
      from: r.posts.authorId,
      to: r.users.id,
    }),
  },
  users: {
    posts: r.many.posts(),
  },
}));

To optimize queries involving users and their posts, create an index on the authorId column in the posts table.

import * as p from "drizzle-orm/pg-core";
import { defineRelations } from 'drizzle-orm';
export const users = p.pgTable('users', {
	id: p.integer().primaryKey(),
	name: p.text(),
});
export const posts = p.pgTable('posts', {
	id: p.integer().primaryKey(),
	content: p.text(),
	authorId: p.integer('author_id'),
}, (t) => [
  p.index('posts_author_id_idx').on(t.authorId)
]);
export const relations = defineRelations({ users, posts }, (r) => ({
  posts: {
    author: r.one.users({
      from: r.posts.authorId,
      to: r.users.id,
    }),
  },
  users: {
    posts: r.many.posts(),
  },
}));

CREATE INDEX "posts_author_id_idx" ON "posts" ("author_id");

Many-to-many Relationships
Many-to-many relationships, implemented using junction tables, require a slightly more nuanced indexing strategy to ensure optimal query performance. Consider the “users and groups” example with the usersToGroups junction table.

For many-to-many relationships, it is generally recommended to create the following indexes on the junction table:

Index on each foreign key column individually: This optimizes queries that filter or join based on a single side of the relationship (e.g., finding all groups for a user OR all users in a group).
Composite index on both foreign key columns together: This is crucial for efficiently resolving the many-to-many relationship itself. It speeds up queries that need to find the connections between both entities.
Why it is important

Example:

In the “users and groups” example, the usersToGroups junction table connects users and groups.

import { defineRelations } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';
export const users = p.pgTable('users', {
  id: p.integer().primaryKey(),
  name: p.text(),
});
export const groups = p.pgTable('groups', {
  id: p.integer().primaryKey(),
  name: p.text(),
});
export const usersToGroups = p.pgTable(
  'users_to_groups',
  {
    userId: p.integer('user_id')
      .notNull()
      .references(() => users.id),
    groupId: p.integer('group_id')
      .notNull()
      .references(() => groups.id),
  },
  (t) => [p.primaryKey({ columns: [t.userId, t.groupId] })],
);
export const relations = defineRelations({ users, groups, usersToGroups },
  (r) => ({
    users: {
      groups: r.many.groups({
        from: r.users.id.through(r.usersToGroups.userId),
        to: r.groups.id.through(r.usersToGroups.groupId),
      }),
    },
    groups: {
      participants: r.many.users(),
    },
  })
);

To optimize queries for users and groups, create indexes on usersToGroups table as follows:

import { defineRelations } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';
export const users = p.pgTable('users', {
  id: p.integer().primaryKey(),
  name: p.text(),
});
export const groups = p.pgTable('groups', {
  id: p.integer().primaryKey(),
  name: p.text(),
});
export const usersToGroups = p.pgTable(
  'users_to_groups',
  {
    userId: p.integer('user_id')
      .notNull()
      .references(() => users.id),
    groupId: p.integer('group_id')
      .notNull()
      .references(() => groups.id),
  },
  (t) => [
    p.primaryKey({ columns: [t.userId, t.groupId] }),
    p.index('users_to_groups_user_id_idx').on(t.userId),
    p.index('users_to_groups_group_id_idx').on(t.groupId),
    p.index('users_to_groups_composite_idx').on(t.userId, t.groupId),
  ],
);
export const relations = defineRelations({ users, groups, usersToGroups },
  (r) => ({
    users: {
      groups: r.many.groups({
        from: r.users.id.through(r.usersToGroups.userId),
        to: r.groups.id.through(r.usersToGroups.groupId),
      }),
    },
    groups: {
      participants: r.many.users(),
    },
  })
);

CREATE INDEX "users_to_groups_user_id_idx" ON "users_to_groups" ("user_id");
CREATE INDEX "users_to_groups_group_id_idx" ON "users_to_groups" ("group_id");
CREATE INDEX "users_to_groups_composite_idx" ON "users_to_groups" ("user_id","group_id");

By applying these indexing strategies, you can significantly improve the performance of your Drizzle ORM applications when working with relational data, especially as your data volume grows and your queries become more complex. Remember to choose the indexes that best suit your specific query patterns and application needs.

Foreign keys
You might’ve noticed that relations look similar to foreign keys — they even have a references property. So what’s the difference?

While foreign keys serve a similar purpose, defining relations between tables, they work on a different level compared to relations.

Foreign keys are a database level constraint, they are checked on every insert/update/delete operation and throw an error if a constraint is violated. On the other hand, relations are a higher level abstraction, they are used to define relations between tables on the application level only. They do not affect the database schema in any way and do not create foreign keys implicitly.

What this means is relations and foreign keys can be used together, but they are not dependent on each other. You can define relations without using foreign keys (and vice versa), which allows them to be used with databases that do not support foreign keys.

The following two examples will work exactly the same in terms of querying the data using Drizzle relational queries.

export const users = p.pgTable("users", {
  id: p.integer().primaryKey(),
  name: p.text(),
});
export const profileInfo = p.pgTable("profile_info", {
  id: p.integer().primaryKey(),
  userId: p.integer("user_id"),
  metadata: p.jsonb(),
});
export const relations = defineRelations({ users, profileInfo }, (r) => ({
  users: {
    profileInfo: r.one.profileInfo({
      from: r.users.id,
      to: r.profileInfo.userId,
    }),
  },
}));

Disambiguating relations
Drizzle also provides the alias option as a way to disambiguate relations when you define multiple of them between the same two tables. For example, if you define a posts table that has the author and reviewer relations.

import { pgTable, integer, text } from 'drizzle-orm/pg-core';
import { defineRelations } from 'drizzle-orm';
 
export const users = pgTable('users', {
	id: integer('id').primaryKey(),
	name: text('name'),
});
export const posts = pgTable('posts', {
	id: integer('id').primaryKey(),
	content: text('content'),
	authorId: integer('author_id'),
	reviewerId: integer('reviewer_id'),
});
 
export const relations = defineRelations({ users, posts }, (r) => ({
  users: {
    posts: r.many.posts({
      alias: "author",
    }),
    reviewedPosts: r.many.posts({
      alias: "reviewer",
    }),
  },
  posts: {
    author: r.one.users({
      from: r.posts.authorId,
      to: r.users.id,
      alias: "author",
    }),
    reviewer: r.one.users({
      from: r.posts.authorId,
      to: r.users.id,
      alias: "reviewer",
    }),
  },
}));Drizzle Queries
Drizzle ORM is designed to be a thin typed layer on top of SQL. We truly believe we’ve designed the best way to operate an SQL database from TypeScript and it’s time to make it better.

Relational queries are meant to provide you with a great developer experience for querying nested relational data from an SQL database, avoiding multiple joins and complex data mappings.

It is an extension to the existing schema definition and query builder. You can opt-in to use it based on your needs. We’ve made sure you have both the best-in-class developer experience and performance.

Important
Inside relational queries, references to a table’s columns must go through the callback parameter, not through the imported table object. This applies to every clause that accepts a callback — orderBy, where.RAW, extras and subqueries inside extras. The callback exposes the aliased table for the current query scope, which is required for correct SQL generation in nested or self-referential queries.

❌
Example

✅
Example


drizzle import path depends on the database driver you’re using.

import { relations } from "./relations";
import { drizzle } from "drizzle-orm/...";
const db = drizzle(process.env.DATABASE_URL, { relations });
const result = await db.query.users.findMany({
  with: {
    posts: true,
  },
});

[{
	id: 10,
	name: "Dan",
	posts: [
		{
			id: 1,
			content: "SQL is awesome",
			authorId: 10,
		},
		{
			id: 2,
			content: "But check relational queries",
			authorId: 10,
		}
	]
}]

Relational queries are an extension to Drizzle’s original query builder. You need to provide all tables and relations from your schema file/files upon drizzle() initialization and then just use the db.query API.

drizzle import path depends on the database driver you’re using.

import { relations } from './relations';
import { drizzle } from 'drizzle-orm/...';
const db = drizzle(process.env.DATABASE_URL,{ relations });
await db.query.users.findMany(...);

Drizzle provides .findMany() and .findFirst() APIs.

Find many
const users = await db.query.users.findMany();

// result type
const result: {
	id: number;
	name: string;
	verified: boolean;
	invitedBy: number | null;
}[];

Find first
.findFirst() will add limit 1 to the query.

const user = await db.query.users.findFirst();

// result type
const result: {
	id: number;
	name: string;
	verified: boolean;
	invitedBy: number | null;
};

Include relations
With operator lets you combine data from multiple related tables and properly aggregate results.

Getting all posts with comments:

const posts = await db.query.posts.findMany({
	with: {
		comments: true,
	},
});

Getting first post with comments:

const post = await db.query.posts.findFirst({
	with: {
		comments: true,
	},
});

You can chain nested with statements as much as necessary.
For any nested with queries Drizzle will infer types using Core Type API.

Get all users with posts. Each post should contain a list of comments:

const users = await db.query.users.findMany({
	with: {
		posts: {
			with: {
				comments: true,
			},
		},
	},
});

Partial fields select
columns parameter lets you include or omit columns you want to get from the database.

Drizzle performs partial selects on the query level, no additional data is transferred from the database.

Keep in mind that a single SQL statement is outputted by Drizzle.

Get all posts with just id, content and include comments:

const posts = await db.query.posts.findMany({
	columns: {
		id: true,
		content: true,
	},
	with: {
		comments: true,
	}
});

Get all posts without content:

const posts = await db.query.posts.findMany({
	columns: {
		content: false,
	},
});

When both true and false select options are present, all false options are ignored.

If you include the name field and exclude the id field, id exclusion will be redundant, all fields apart from name would be excluded anyways.

Exclude and Include fields in the same query:

const users = await db.query.users.findMany({
	columns: {
		name: true,
		id: false //ignored
	},
});

// result type
const users: {
	name: string;
};

Only include columns from nested relations:

const res = await db.query.users.findMany({
	columns: {},
	with: {
		posts: true
	}
});

// result type
const res: {
	posts: {
		id: number,
		text: string
	}
}[];

Nested partial fields select
Just like with partial select, you can include or exclude columns of nested relations:

const posts = await db.query.posts.findMany({
	columns: {
		id: true,
		content: true,
	},
	with: {
		comments: {
			columns: {
				authorId: false
			}
		}
	}
});

Select filters
Just like in our SQL-like query builder, relational queries API lets you define filters and conditions with the list of our operators.

You can either import them from drizzle-orm or use from the callback syntax:

const users = await db.query.users.findMany({
	where: {
		id: 1
	}
});

select
  "d0"."id" as "id",
  "d0"."name" as "name"
from
  "users" as "d0"
where
  "d0"."id" = 1

Find post with id=1 and comments that were created before particular date:

await db.query.posts.findMany({
  where: {
    id: 1,
  },
  with: {
    comments: {
      where: {
        createdAt: { lt: new Date() },
      },
    },
  },
});

List of all filter operators

where: {
    OR: [],
    AND: [],
    NOT: {},
    RAW: (table) => sql`${table.id} = 1`,
    // filter by relations
    [relation]: {},
	  // filter by columns
    [column]: {
      OR: [],
      AND: [],
      NOT: {},
      eq: 1,
      ne: 1,
      gt: 1,
      gte: 1,
      lt: 1,
      lte: 1,
      in: [1],
      notIn: [1],
      like: "",
      ilike: "",
      notLike: "",
      notIlike: "",
      isNull: true,
      isNotNull: true,
      arrayOverlaps: [1, 2],
      arrayContained: [1, 2],
      arrayContains: [1, 2]
    },
},

Examples

const response = await db.query.users.findMany({
  where: {
    age: 15,
  },
});

select
  "d0"."id" as "id",
  "d0"."name" as "name",
  "d0"."age" as "age"
from
  "users" as "d0"
where
  "d0"."age" = 15

Relations Filters
With Drizzle Relations, you can filter not only by the table you’re querying but also by any table you include in the query.

Example: Get all users whose ID>10 and who have at least one post with content starting with “M”

const usersWithPosts = await db.query.usersTable.findMany({
  where: {
    id: {
      gt: 10
    },
    posts: {
      content: {
        like: 'M%'
      }
    }
  },
});

Example: Get all users with posts, only if user has at least 1 post

const response = await db.query.users.findMany({
  with: {
    posts: true,
  },
  where: {
    posts: true,
  },
});

Limit & Offset
Drizzle ORM provides limit & offset API for queries and for the nested entities.

Find 5 posts:

await db.query.posts.findMany({
	limit: 5,
});

Find posts and get 3 comments at most:

await db.query.posts.findMany({
	with: {
		comments: {
			limit: 3,
		},
	},
});

IMPORTANT
offset now can be used in with tables as well!

await db.query.posts.findMany({
	limit: 5,
	offset: 2, // correct ✅
	with: {
		comments: {
			offset: 3, // correct ✅
			limit: 3,
		},
	},
});

Find posts with comments from the 6th to the 10th post:

await db.query.posts.findMany({
	with: {
		comments: true,
	},
  limit: 5,
  offset: 5,
});

Order By
Drizzle provides API for ordering in the relational query builder.

You can use same ordering core API or use order by operator from the callback with no imports.

important
When you use multiple orderBy statements in the same table, they will be included in the query in the same order in which you added them

await db.query.posts.findMany({
  orderBy: {
    id: "asc",
  },
});

Order by asc + desc:

  await db.query.posts.findMany({
    orderBy: { id: "asc" },
    with: {
      comments: {
        orderBy: { id: "desc" },
      },
    },
  });

You can also use custom sql in order by statement:

await db.query.posts.findMany({
  orderBy: (t) => sql`${t.id} asc`,
  with: {
    comments: {
      orderBy: (t, { desc }) => desc(t.id),
    },
  },
});

Include custom fields
Relational query API lets you add custom additional fields. It’s useful when you need to retrieve data and apply additional functions to it.

IMPORTANT
As of now aggregations are not supported in extras, please use core queries for that.

import { sql } from 'drizzle-orm';
await db.query.users.findMany({
  extras: {
    loweredName: (table) => sql`lower(${table.name})`,
  },
});

await db.query.users.findMany({
	extras: {
		loweredName: (users, { sql }) => sql`lower(${users.name})`,
	},
})

lowerName as a key will be included to all fields in returned object.

IMPORTANT
If you will specify .as("<alias>") for any extras field - drizzle will ignore it

To retrieve all users with groups, but with the fullName field included (which is a concatenation of firstName and lastName), you can use the following query with the Drizzle relational query builder.

const res = await db.query.users.findMany({
	extras: {
		fullName: (users, { sql }) => sql<string>`concat(${users.name}, " ", ${users.name})`,
	},
	with: {
		groups: true,
	},
});

// result type
const res: {
    id: number;
    name: string;
    age: number | null;
    invitedBy: number | null;
    fullName: string;
    groups: {
        id: number;
        name: string;
        description: string | null;
    }[];
}[]

To retrieve all posts with comments and add an additional field to calculate the size of the post content and the size of each comment content:

const res = await db.query.posts.findMany({
	extras: {
		contentLength: (table, { sql }) => sql<number>`length(${table.content})`,
	},
	with: {
		comments: {
			extras: {
				commentSize: (table, { sql }) => sql<number>`length(${table.content})`,
			},
		},
	},
});

// result type
const res: {
    id: number;
    content: string;
    authorId: number | null;
    createdAt: Date;
    contentLength: number;
    comments: {
        id: number;
        content: string;
        createdAt: Date;
        creator: number | null;
        postId: number | null;
        commentSize: number;
    }[];
}[]

Include subqueries
You can also use subqueries within Relational Queries to leverage the power of custom SQL syntax

Get users with posts and total posts count for each user

import { posts } from './schema';
import { eq } from 'drizzle-orm';
await db.query.users.findMany({
  with: {
    posts: true
  },
  extras: {
    totalPostsCount: (table) => db.$count(posts, eq(posts.authorId, table.id)),
  }
});

SELECT
  "d0"."id" AS "id",
  "d0"."name" AS "name",
  "d0"."age" AS "age",
  "d0"."invited_by" AS "invitedBy",
  (
    (
      SELECT
        count(*)
      FROM
        "posts"
      WHERE
        "posts"."author_id" = "d0"."id"
    )
  ) AS "totalPostsCount",
  "posts"."r" AS "posts"
FROM
  "users" AS "d0"
  LEFT JOIN LATERAL (
    SELECT
      coalesce(json_agg(row_to_json("t".*)), '[]') AS "r"
    FROM
      (
        SELECT
          "d1"."id" AS "id",
          "d1"."content" AS "content",
          "d1"."author_id" AS "authorId",
          "d1"."created_at"::text AS "createdAt"
        FROM
          "posts" AS "d1"
        WHERE
          "d0"."id" = "d1"."author_id"
      ) AS "t"
  ) AS "posts" ON TRUE

Prepared statements
Prepared statements are designed to massively improve query performance — see here.

In this section, you can learn how to define placeholders and execute prepared statements using the Drizzle relational query builder.

Placeholder in where
const prepared = db.query.users.findMany({
    where: { id: { eq: sql.placeholder("id") } },
    with: {
      posts: {
        where: { id: 1 },
      },
    },
}).prepare("query_name");
const usersWithPosts = await prepared.execute({ id: 1 });

Placeholder in limit
const prepared = db.query.users.findMany({
    with: {
      posts: {
        limit: sql.placeholder("limit"),
      },
    },
  }).prepare("query_name");
const usersWithPosts = await prepared.execute({ limit: 1 });

Placeholder in offset
const prepared = db.query.users.findMany({
	offset: sql.placeholder('offset'),
	with: {
		posts: true,
	},
}).prepare('query_name');
const usersWithPosts = await prepared.execute({ offset: 1 });

Multiple placeholders
const prepared = db.query.users.findMany({
    limit: sql.placeholder("uLimit"),
    offset: sql.placeholder("uOffset"),
    where: {
      OR: [{ id: { eq: sql.placeholder("id") } }, { id: 3 }],
    },
    with: {
      posts: {
        where: { id: { eq: sql.placeholder("pid") } },
        limit: sql.placeholder("pLimit"),
      },
    },
}).prepare("query_name");
const usersWithPosts = await prepared.execute({ pLimit: 1, uLimit: 3, uOffset: 1, id: 2, pid: 6 });Batch API
Drizzle supports running SQL statements in a batch with the Neon HTTP driver for PostgreSQL.

const batchResponse = await db.batch([
  db.insert(usersTable).values({ id: 1, name: 'John' }).returning({ id: usersTable.id }),
  db.update(usersTable).set({ name: 'Dan' }).where(eq(usersTable.id, 1)),
  db.query.usersTable.findMany({}),
  db.select().from(usersTable).where(eq(usersTable.id, 1)),
  db.select({ id: usersTable.id, invitedBy: usersTable.invitedBy }).from(usersTable),
]);

type BatchResponse = [
  { id: number }[],
  NeonHttpQueryResult,
  { id: number; name: string; verified: number; invitedBy: number | null }[],
  { id: number; name: string; verified: number; invitedBy: number | null }[],
  { id: number; invitedBy: number | null }[],
]

All possible builders that can be used inside db.batch:

db.query.<table>.findMany(),
db.query.<table>.findFirst(),
db.select()...,
db.update()...,
db.delete()...,
db.insert()...,