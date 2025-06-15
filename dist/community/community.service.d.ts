import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { Prisma } from '@prisma/client';
export declare class CommunityService {
    private prisma;
    constructor(prisma: PrismaService);
    createPost(createPostDto: CreatePostDto, authorId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        title: string;
        imageUrl: string | null;
        viewCount: number;
        tags: string[];
        poll: Prisma.JsonValue | null;
        authorId: string;
        categoryId: string;
    }>;
    getAllPosts(categoryId?: string, page?: number, limit?: number): Promise<{
        posts: {
            id: string;
            createdAt: Date;
            _count: {
                comments: number;
            };
            category: {
                name: string;
                id: string;
                isPollCategory: boolean;
            };
            content: string;
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
            createdAt: Date;
            _count: {
                comments: number;
            };
            category: {
                name: string;
                id: string;
                isPollCategory: boolean;
            };
            content: string;
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
        comments: ({
            author: {
                nickname: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            authorId: string;
            communityPostId: string | null;
            journalId: string | null;
            parentId: string | null;
        })[];
        category: {
            name: string;
            id: string;
            isPollCategory: boolean;
        };
        author: {
            nickname: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        title: string;
        imageUrl: string | null;
        viewCount: number;
        tags: string[];
        poll: Prisma.JsonValue | null;
        authorId: string;
        categoryId: string;
    }) | null>;
    createComment(postId: string, content: string, authorId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        authorId: string;
        communityPostId: string | null;
        journalId: string | null;
        parentId: string | null;
    }>;
    createReply(postId: string, parentId: string, content: string, authorId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        authorId: string;
        communityPostId: string | null;
        journalId: string | null;
        parentId: string | null;
    }>;
    updatePost(postId: string, updateData: any, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        title: string;
        imageUrl: string | null;
        viewCount: number;
        tags: string[];
        poll: Prisma.JsonValue | null;
        authorId: string;
        categoryId: string;
    }>;
    deletePost(postId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        title: string;
        imageUrl: string | null;
        viewCount: number;
        tags: string[];
        poll: Prisma.JsonValue | null;
        authorId: string;
        categoryId: string;
    }>;
    voteOnPost(postId: string, userId: string, option: string): Promise<{
        id: string;
        createdAt: Date;
        postId: string;
        option: string;
        userId: string;
    }>;
    getPollResult(postId: string): Promise<Record<string, number>>;
}
