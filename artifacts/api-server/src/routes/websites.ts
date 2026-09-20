import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, activitiesTable, websitesTable } from "@workspace/db";
import {
  CreateWebsiteBody,
  CreateWebsiteResponse,
  DeleteWebsiteParams,
  UpdateWebsiteBody,
  UpdateWebsiteParams,
  UpdateWebsiteResponse,
  ListWebsitesResponse,
  ListWebsitesResponseItem,
} from "@workspace/api-zod";
import { getCurrentUser, hasRole, requireUser } from "../lib/auth";

const router: IRouter = Router();
let seeded = false;

function serializeWebsite(row: typeof websitesTable.$inferSelect) {
  return ListWebsitesResponseItem.parse({
    id: row.id,
    name: row.name,
    url: row.url,
    githubUrl: row.githubUrl,
    imageUrl: row.imageUrl,
    description: row.description,
    status: row.status,
    visits: row.visits,
    updatedAt: row.updatedAt,
    ownerName: row.ownerName,
  });
}

async function seedWebsites(): Promise<void> {
  if (seeded) return;
  const existing = await db.select({ id: websitesTable.id }).from(websitesTable).limit(1);
  if (existing.length === 0) {
    await db.insert(websitesTable).values([
      {
        name: "Northstar Studio",
        url: "https://northstar-studio.netlify.app",
        githubUrl: "https://github.com/alexfuchs/northstar-studio",
        description: "Portfolio and case studies for a small digital studio.",
        status: "live",
        visits: 12480,
        ownerId: "system",
        ownerName: "Alex Fuchs",
      },
      {
        name: "Form & Function",
        url: "https://form-and-function.netlify.app",
        githubUrl: "https://github.com/alexfuchs/form-and-function",
        description: "A product design resource library.",
        status: "live",
        visits: 8340,
        ownerId: "system",
        ownerName: "Alex Fuchs",
      },
      {
        name: "Lumen Journal",
        url: "https://lumen-journal.netlify.app",
        githubUrl: null,
        description: "A private writing space, currently in draft.",
        status: "draft",
        visits: 0,
        ownerId: "system",
        ownerName: "Alex Fuchs",
      },
    ]);
  }
  seeded = true;
}

router.get("/websites", async (_req, res): Promise<void> => {
  await seedWebsites();
  const websites = await db
    .select()
    .from(websitesTable)
    .orderBy(desc(websitesTable.updatedAt));
  res.json(ListWebsitesResponse.parse(websites.map(serializeWebsite)));
});

router.post("/websites", requireUser, async (req, res): Promise<void> => {
  const user = res.locals.currentUser as Awaited<ReturnType<typeof getCurrentUser>>;
  if (!user || !hasRole(user, ["admin"])) {
    res.status(403).json({ error: "Admin role required" });
    return;
  }

  const parsed = CreateWebsiteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [website] = await db
    .insert(websitesTable)
    .values({
      ...parsed.data,
      status: parsed.data.status ?? "draft",
      ownerId: user.id,
      ownerName: user.name,
    })
    .returning();
  await db.insert(activitiesTable).values({
    type: "website_added",
    message: `Added ${website.name}`,
    actorName: user.name,
  });
  res.status(201).json(CreateWebsiteResponse.parse(serializeWebsite(website)));
});

router.patch("/websites/:websiteId", requireUser, async (req, res): Promise<void> => {
  const user = res.locals.currentUser as Awaited<ReturnType<typeof getCurrentUser>>;
  if (!user || !hasRole(user, ["admin"])) {
    res.status(403).json({ error: "Admin role required" });
    return;
  }

  const params = UpdateWebsiteParams.safeParse(req.params);
  const body = UpdateWebsiteBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [website] = await db
    .update(websitesTable)
    .set({ ...body.data, updatedAt: new Date() })
    .where(eq(websitesTable.id, params.data.websiteId))
    .returning();
  if (!website) {
    res.status(404).json({ error: "Website not found" });
    return;
  }
  await db.insert(activitiesTable).values({
    type: "website_updated",
    message: `Updated ${website.name}`,
    actorName: user.name,
  });
  res.json(UpdateWebsiteResponse.parse(serializeWebsite(website)));
});

router.delete("/websites/:websiteId", requireUser, async (req, res): Promise<void> => {
  const user = res.locals.currentUser as Awaited<ReturnType<typeof getCurrentUser>>;
  if (!user || !hasRole(user, ["admin"])) {
    res.status(403).json({ error: "Admin role required" });
    return;
  }
  const params = DeleteWebsiteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [website] = await db
    .delete(websitesTable)
    .where(eq(websitesTable.id, params.data.websiteId))
    .returning();
  if (!website) {
    res.status(404).json({ error: "Website not found" });
    return;
  }
  await db.insert(activitiesTable).values({
    type: "website_deleted",
    message: `Removed ${website.name}`,
    actorName: user.name,
  });
  res.sendStatus(204);
});

export default router;