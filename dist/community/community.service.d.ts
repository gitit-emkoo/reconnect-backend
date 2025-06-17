import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { Prisma } from '@prisma/client';
export declare class CommunityService {
    private prisma;
    constructor(prisma: PrismaService);
    createPost(createPostDto: CreatePostDto, authorId: string): Promise<{
        id: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        categoryId: string;
        imageUrl: string | null;
        tags: string[];
        poll: Prisma.JsonValue | null;
        viewCount: number;
        authorId: string;
    }>;
    getAllPosts(categoryId?: string, page?: number, limit?: number): Promise<{
        posts: {
            id: string;
            content: string;
            createdAt: Date;
            category: {
                id: string;
                name: string;
                isPollCategory: boolean;
            };
            _count: {
                comments: number;
            };
            title: string;
            tags: string[];
            poll: Prisma.JsonValue;
            author: {
                nickname: string;
            };
        }[];
        total: number;
    }>;
    findAll(categoryId?: string, search?: string, page?: number, limit?: number): Promise<{
        posts: {
            id: string;
            content: string;
            createdAt: Date;
            category: {
                id: string;
                name: string;
                isPollCategory: boolean;
            };
            _count: {
                comments: number;
            };
            title: string;
            tags: string[];
            poll: Prisma.JsonValue;
            author: {
                nickname: string;
            };
        }[];
        total: number;
    }>;
    getPostById(id: string): Promise<({
        category: {
            id: string;
            name: string;
            isPollCategory: boolean;
        };
        comments: ({
            author: {
                nickname: string;
            };
        } & {
            id: string;
            content: string;
            createdAt: Date;
            updatedAt: Date;
            authorId: string;
            communityPostId: string | null;
            journalId: string | null;
            parentId: string | null;
        })[];
        votes: {
            id: string;
            userId: string;
            createdAt: Date;
            option: string;
            postId: string;
        }[];
        author: {
            nickname: string;
        };
    } & {
        id: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        categoryId: string;
        imageUrl: string | null;
        tags: string[];
        poll: Prisma.JsonValue | null;
        viewCount: number;
        authorId: string;
    }) | null>;
    createComment(postId: string, content: string, authorId: string): Promise<{
        id: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
        authorId: string;
        communityPostId: string | null;
        journalId: string | null;
        parentId: string | null;
    }>;
    createReply(postId: string, parentId: string, content: string, authorId: string): Promise<{
        id: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
        authorId: string;
        communityPostId: string | null;
        journalId: string | null;
        parentId: string | null;
    }>;
    updatePost(postId: string, updateData: any, userId: string): Promise<{
        id: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        categoryId: string;
        imageUrl: string | null;
        tags: string[];
        poll: Prisma.JsonValue | null;
        viewCount: number;
        authorId: string;
    }>;
    deletePost(postId: string, userId: string): Promise<{
        id: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        categoryId: string;
        imageUrl: string | null;
        tags: string[];
        poll: Prisma.JsonValue | null;
        viewCount: number;
        authorId: string;
    }>;
    voteOnPost(postId: string, userId: string, choice: number): Promise<{
        cancelled: boolean;
        changed?: undefined;
        created?: undefined;
    } | {
        changed: boolean;
        cancelled?: undefined;
        created?: undefined;
    } | {
        created: boolean;
        cancelled?: undefined;
        changed?: undefined;
    }>;
    getPollResult(postId: string): Promise<Record<string, number>>;
}
