import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { PaintBrush01Icon, Delete02Icon, MoreHorizontalCircle01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton"


const DonationsTable = ({filteredData, loading}: {filteredData: any[], loading?: boolean}) => {

    const [selectedBoxes, setSelectedBoxes] = useState<boolean[]>([]);

    const selectAll = (value:boolean) => {
        selectedBoxes.map((item, i) => {
            selectedBoxes[i] = value;
        })

        setSelectedBoxes(selectedBoxes.slice());
    }

    const selectThisBox = (i:number) => {
        selectedBoxes[i] = !selectedBoxes[i];

        setSelectedBoxes(selectedBoxes.slice());
    }

    useEffect(() => {
        return setSelectedBoxes(Array(filteredData.length).fill(false));
    }, [filteredData]);

    return (
        <div className="overflow-x-auto">
        <Table>
        <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="text-xs font-medium text-muted-foreground py-3"><input type="checkbox" onChange={(e) => selectAll(e.target.checked)}/></TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground py-3 pl-6">Date</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground py-3">Store</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground py-3">Amount</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground py-3">Volunteer</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground py-3">Recipient</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground py-3">Notes</TableHead>
            <TableHead className="text-xs font-medium text-muted-foreground py-3 text-right">Action</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={idx}>
                        <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                        <TableCell className="py-3 pl-6"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-4 w-16 rounded-full" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="py-3 text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                ))
            ) : filteredData.length > 0 ? (
            filteredData.map((d, i) => (
                <TableRow key={d.id} className="border-border hover:bg-muted/50">
                    <TableCell><input type="checkbox" onChange={(e) => selectThisBox(i)} checked={!!selectedBoxes[i]}/></TableCell>
                <TableCell className="text-sm text-muted-foreground py-3 pl-6">
                    {new Date(d.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-sm font-medium text-foreground py-3">
                    
                    {d.giftCard?.store?.name ?? "Unknown Store"}<br/>
                    <span className="text-muted-foreground">{"DONATION_OUT"}</span>
                    </TableCell>
                <TableCell className="py-3">
                    <span className="tabular-nums font-medium text-foreground text-sm">
                    ${d.amount}
                    </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground py-3">{d.volunteerName}</TableCell>
                <TableCell className="text-sm text-muted-foreground py-3">{d.recipientName}</TableCell>
                <TableCell className="text-sm text-muted-foreground py-3">{d.notes}</TableCell>
                <TableCell className="py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground">
                      <HugeiconsIcon icon={PaintBrush01Icon} strokeWidth={2} className="size-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground">
                          <HugeiconsIcon icon={MoreHorizontalCircle01Icon} strokeWidth={2} className="size-4" />
                          <span className="sr-only">More actions</span>
                        </Button>
                      } />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer">
                          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
                </TableRow>
            ))
            ) : (
            <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-sm">
                No donations found matching your filters.
                </TableCell>
            </TableRow>
            )}
        </TableBody>
        </Table>
        </div>
    )
}

export default DonationsTable;