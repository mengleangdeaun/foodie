import { useState, useEffect } from 'react';
import api from '@/util/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { Loader2, Mail, Phone } from "lucide-react";

interface Submission {
    id: number;
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    message: string;
    created_at: string;
}

const ContactSubmissions = () => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const res = await api.get('/super-admin/contact-submissions');
                setSubmissions(res.data.data);
            } catch (error) {
                console.error("Failed to fetch", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSubmissions();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Contact Messages</h1>
                <p className="text-muted-foreground">
                    View messages sent from the landing page contact form.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Inbox</CardTitle>
                    <CardDescription>Latest messages from potential leads.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Contact Info</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead className="w-[400px]">Message</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {submissions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No messages found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                submissions.map((sub) => (
                                    <TableRow key={sub.id}>
                                        <TableCell className="whitespace-nowrap font-medium">
                                            {format(new Date(sub.created_at), 'MMM d, yyyy h:mm a')}
                                        </TableCell>
                                        <TableCell>{sub.name}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                                    {sub.email}
                                                </div>
                                                {sub.phone && (
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-3 w-3 text-muted-foreground" />
                                                        {sub.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{sub.subject || <span className="text-muted-foreground italic">No Subject</span>}</TableCell>
                                        <TableCell className="whitespace-pre-wrap text-sm text-muted-foreground">
                                            {sub.message}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default ContactSubmissions;
