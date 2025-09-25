using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RozetkaApi.Data;
using rozetkabackend.Constants;
using rozetkabackend.Data.Entities.Catalog;
using rozetkabackend.Entities.Identity;
using rozetkabackend.Models.Order;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Claims;

namespace rozetkabackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<UserEntity> _userManager;
        private readonly IMapper _mapper;

        public OrdersController(AppDbContext context,
            UserManager<UserEntity> userManager,
            IMapper mapper)
        {
            //Thread.Sleep(2000);
            _context = context;
            _mapper = mapper;
            _userManager = userManager;
        }
        private async Task<UserEntity?> GetCurrentUserAsync()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrEmpty(userId))
                return await _userManager.FindByIdAsync(userId);

            var email = User.FindFirstValue(ClaimTypes.Email) ?? User.Identity?.Name;
            if (!string.IsNullOrEmpty(email))
                return await _userManager.FindByEmailAsync(email);

            return null;
        }

        [HttpGet]
        [Route("status/list")]
        public async Task<IActionResult> StatusList()
        {
            try
            {
                //Thread.Sleep(2000);
                var model = await _context.OrderStatuses
                    .Select(x => _mapper.Map<OrderStatusItemViewModel>(x))
                    .ToListAsync();
                return Ok(model);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    invalid = ex.Message
                });
            }
        }

        [HttpPost]
        [Route("add")]
        public async Task<IActionResult> Add([FromBody] OrderAddViewModel model)
        {
            try
            {
                var user = await GetCurrentUserAsync();
                if (user == null) return Unauthorized();

                var entity = _mapper.Map<OrderEntity>(model);
                entity.UserId = user.Id;
                _context.Orders.Add(entity);
                await _context.SaveChangesAsync();

                var entityItems = model.OrderItems.Select(x => _mapper.Map<OrderItemEntity>(x));
                foreach (var item in entityItems)
                {
                    item.OrderId = entity.Id;
                    _context.OrderItems.Add(item);
                }
                await _context.SaveChangesAsync();

                var cartData = await _context.Carts.Where(x => x.UserId == user.Id).ToListAsync();
                _context.Carts.RemoveRange(cartData);
                await _context.SaveChangesAsync();
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(new { invalid = ex.Message });
            }
        }

        [HttpGet]
        [Route("list")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> List()
        {
            try
            {
                //Thread.Sleep(2000);
                var model = await _context.Orders
                    .Include(x => x.OrderItems).ThenInclude(x => x.Product).ThenInclude(x => x.ProductImages)
                    .Include(x => x.OrderStatus)
                    .OrderByDescending(x => x.DateCreated)
                    .Select(x => _mapper.Map<OrderViewModel>(x))
                    .ToListAsync();
                return Ok(model);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    invalid = ex.Message
                });
            }
        }

        [HttpPost]
        [Route("status/change")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> ChangeStatus([FromBody] OrderChangeStatusViewModel model)
        {
            try
            {
                //Thread.Sleep(2000);
                var order = await _context.Orders.SingleOrDefaultAsync(x => x.Id == model.Id);
                order.OrderStatusId = model.StatusId;
                _context.SaveChanges();
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    invalid = ex.Message
                });
            }
        }


        [HttpGet]
        [Route("user/list")]
        public async Task<IActionResult> UserList()
        {
            try
            {
                var user = await GetCurrentUserAsync();
                if (user == null) return Unauthorized();

                var model = await _context.Orders
                    .Include(x => x.OrderItems).ThenInclude(x => x.Product).ThenInclude(x => x.ProductImages)
                    .Include(x => x.OrderStatus)
                    .Where(x => x.UserId == user.Id)
                    .OrderByDescending(x => x.DateCreated)
                    .Select(x => _mapper.Map<OrderViewModel>(x))
                    .ToListAsync();

                return Ok(model);
            }
            catch (Exception ex)
            {
                return BadRequest(new { invalid = ex.Message });
            }
        }
    }
}
