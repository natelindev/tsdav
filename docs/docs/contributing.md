---
sidebar_position: 7
---

# Contributing

First you need to clone the repo and

### Build

```bash
npm run build
```

or

```bash
yarn build
```

### WEBDAV quick guide

WEBDAV uses xml for all its data when communicating, the basic element is `object`, multiple `object`s can form a `collection`, webdav server have `account`s and an `account` have a `principal` resource (i.e the default, main resource) and under that principle resource we have `home set` of the said resource where your actual resources are.

`syncToken` and `ctag` are basically like hash of the object/collection, if anything in it changes, this token will change.

For caldav, the calendar data in caldav are in `rfc5545` ical format, there's `iCal2Js` and `js2iCal` function with my other project [pretty-jcal](https://github.com/llldar/pretty-jcal) to help your convert them from/to js objects.

Here's cheat sheet on webdav operations compared with rest:

<table>
	<thead>
		<tr>
			<th>Operation</th>
			<th>Webdav</th>
			<th>REST</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>Create collection</td>
			<td>
				<ul>
					<li>predefined id: `MKCOL /entities/$predefined_id`</li>
					<li>no predefined id: not possible</li>
					<li>can set attributes right away with extended-mkcol extension</li>
					<li>Status: 201 Created</li>
				</ul>
			</td>
			<td rowspan="2">
				<ul>
					<li>`POST /entities` with JSON body with attributes, response contains new id</li>
					<li>Status: 200 with new id and optionally the whole object</li>
				</ul>
			</td>
		</tr>
		<tr>
			<td>Create entity</td>
			<td>
				<ul>
					<li>predefined id: `PUT /entities/$predefined_id` with body, empty response</li>
					<li>no predefined id: `POST /entities`, receive id as part of Content-Location header</li>
					<li>can't set attributes right away, need subsequent PROPPATCH</li>
					<li>Status: 201 Created</li>
				</ul>
			</td>
		</tr>
		<tr>
			<td>Update entity body</td>
			<td>
				<ul>
					<li>`PUT /entities/$predefined_id` with new body (no attributes)</li>
					<li>Status: 204 No Content</li>
				</ul>
			</td>
			<td rowspan="2">
				<ul>
					<li>Full: `PUT /entities/$id` with full JSON body with attributes</li>
					<li>Status 200, receive full object back</li>
					<li>Partial: `PATCH /entities/$id` with partial JSON containing only attributes to update.</li>
					<li>Status 200, full/partial object returned</li>
				</ul>
			</td>
		</tr>
		<tr>
			<td>Update entity attributes</td>
			<td>
				<ul>
					<li>`PROPPATCH /entities/$id` with XML body of attributes to change</li>
					<li>Status: 207, XML body with accepted attributes</li>
				</ul>
			</td>
		</tr>
		<tr>
			<td>Delete entity</td>
			<td colspan="2">
				<ul>
					<li>`DELETE /entities/$id`</li>
					<li>Sattus: 204 no content</li>
				</ul>
			</td>
		</tr>
		<tr>
			<td>List entities</td>
			<td>
				<ul>
					<li>`PROPFIND /entities` with XML body of attributes to fetch</li>
					<li>Status 207 multi-status XML response with multiple entities and their respective attributes</li>
				</ul>
			</td>
			<td>
				<ul>
					<li>`GET /entities`</li>
					<li>Status: 200 OK, receive JSON response array with JSON body of entity attributes</li>
				</ul>
			</td>
		</tr>
		<tr>
			<td>Get entity</td>
			<td>
				<ul>
					<li>`GET /entities/$id`</li>
					<li>Status: 200 OK with entitiy body</li>
				</ul>
			</td>
			<td rowspan="2">
				<ul>
					<li>`GET /entities/$id`</li>
					<li>Status 200 OK, receive JSON body of entity attributes</li>
				</ul>
			</td>
		</tr>
		<tr>
			<td>Get entity attributes</td>
			<td>
				<ul>
					<li>`PROPFIND /entities/$id` with XML body of attributes to fetch</li>
					<li>Status 207 multi-status XML response with entity attributes</li>
				</ul>
			</td>
		</tr>
		<tr>
			<td>Notes</td>
			<td>
				<ul>
					<li>cannot always set attributes right away at creation time, need subsequent `PROPPATCH`</li>
				</ul>
			</td>
			<td>
				<ul>
					<li>no concept of body vs attributes</li>
					<li>entity can be either collection or model (for collection `/entities/$collectionId/$itemId`)</li>
				</ul>
			</td>
		</tr>
	</tbody>
</table>
